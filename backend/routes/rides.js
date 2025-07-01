import express from "express";
import { z } from "zod";
import { db, cleanupExpiredRides } from "../server.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Validation schemas
const createRideSchema = z.object({
  destination: z.string().min(1).max(255),
  pickupLocation: z.string().max(255).optional(),
  timeWindowStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  timeWindowEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxSeats: z.number().min(1).max(8).default(4),
  notes: z.string().max(500).optional(),
});

// Utility function to check if a ride is expired
function isRideExpired(rideDate, endTime) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);

  const currentDate = istTime.toISOString().split("T")[0]; // YYYY-MM-DD format
  const currentTime = istTime.toTimeString().split(" ")[0].substring(0, 5); // HH:MM format

  // Check if ride date is in the past
  if (rideDate < currentDate) {
    return true;
  }

  // If same date, check if end time has passed
  if (rideDate === currentDate && endTime < currentTime) {
    return true;
  }

  return false;
}

// Get all rides with filters
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Run cleanup before fetching rides to ensure expired rides are removed
    await cleanupExpiredRides();

    const { destination, date, status = "active" } = req.query;

    let query = `
      SELECT 
        r.*,
        u.name as creator_name,
        u.email as creator_email,
        (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as participant_count
      FROM rides r
      JOIN users u ON r.creator_id = u.id
    `;

    const params = [];

    // Handle status filtering
    if (status === "all") {
      query += " WHERE (r.status = 'active' OR r.status = 'completed')";
    } else {
      query += " WHERE r.status = ?";
      params.push(status);
    }

    if (destination) {
      query += " AND r.destination LIKE ?";
      params.push(`%${destination}%`);
    }

    if (date) {
      query += " AND r.date = ?";
      params.push(date);
    }

    query += " ORDER BY r.date ASC, r.time_window_start ASC";

    const [rides] = await db.execute(query, params);

    // Filter out any expired rides that might have slipped through cleanup
    // Only apply expired filtering to active rides
    let filteredRides;
    if (status === "active") {
      filteredRides = rides.filter(ride => !isRideExpired(ride.date, ride.time_window_end));
    } else {
      // For completed rides or "all" status, don't filter by expiration
      filteredRides = rides;
    }

    // Get participants for each ride
    for (let ride of filteredRides) {
      const [participants] = await db.execute(
        `
        SELECT u.id, u.name, u.email, rp.joined_at
        FROM ride_participants rp
        JOIN users u ON rp.user_id = u.id
        WHERE rp.ride_id = ?
        ORDER BY rp.joined_at ASC
      `,
        [ride.id]
      );

      ride.participants = participants;
    }

    res.json({ rides: filteredRides });
  } catch (error) {
    console.error("Get rides error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single ride
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;

    const [rides] = await db.execute(
      `
      SELECT 
        r.*,
        u.name as creator_name,
        u.email as creator_email
      FROM rides r
      JOIN users u ON r.creator_id = u.id
      WHERE r.id = ?
    `,
      [rideId]
    );

    if (rides.length === 0) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = rides[0];

    // Get participants
    const [participants] = await db.execute(
      `
      SELECT u.id, u.name, u.email, rp.joined_at
      FROM ride_participants rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.ride_id = ?
      ORDER BY rp.joined_at ASC
    `,
      [rideId]
    );

    ride.participants = participants;

    // Get chat messages
    const [messages] = await db.execute(
      `
      SELECT cm.id, cm.message, cm.created_at, u.name as user_name, u.id as user_id
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.ride_id = ?
      ORDER BY cm.created_at ASC
    `,
      [rideId]
    );

    ride.messages = messages;

    res.json({ ride });
  } catch (error) {
    console.error("Get ride error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new ride
router.post("/", authenticateToken, async (req, res) => {
  try {
    const data = createRideSchema.parse(req.body);

    // Check for existing matching rides
    const [existingRides] = await db.execute(
      `
      SELECT id FROM rides 
      WHERE destination = ? 
      AND date = ? 
      AND status = 'active'
      AND (
        (time_window_start <= ? AND time_window_end >= ?) OR
        (time_window_start <= ? AND time_window_end >= ?) OR
        (time_window_start >= ? AND time_window_end <= ?)
      )
    `,
      [
        data.destination,
        data.date,
        data.timeWindowStart,
        data.timeWindowStart,
        data.timeWindowEnd,
        data.timeWindowEnd,
        data.timeWindowStart,
        data.timeWindowEnd,
      ]
    );

    if (existingRides.length > 0) {
      return res.status(409).json({
        message: "A matching ride already exists for this time window",
        existingRideId: existingRides[0].id,
      });
    }

    // Create new ride
    const [result] = await db.execute(
      `
      INSERT INTO rides (
        creator_id, destination, pickup_location, 
        time_window_start, time_window_end, date, 
        max_seats, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        req.userId,
        data.destination,
        data.pickupLocation || null,
        data.timeWindowStart,
        data.timeWindowEnd,
        data.date,
        data.maxSeats,
        data.notes || null,
      ]
    );

    const rideId = result.insertId;

    // Add creator as participant
    await db.execute(
      "INSERT INTO ride_participants (ride_id, user_id) VALUES (?, ?)",
      [rideId, req.userId]
    );

    // Update popular destinations
    await db.execute(
      `
      INSERT INTO popular_destinations (destination, count) 
      VALUES (?, 1) 
      ON DUPLICATE KEY UPDATE count = count + 1
    `,
      [data.destination]
    );

    // Get the created ride with details
    const [rides] = await db.execute(
      `
      SELECT 
        r.*,
        u.name as creator_name,
        u.email as creator_email
      FROM rides r
      JOIN users u ON r.creator_id = u.id
      WHERE r.id = ?
    `,
      [rideId]
    );

    res.status(201).json({
      message: "Ride created successfully",
      ride: rides[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Create ride error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Join a ride
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.userId;

    console.log(`🚗 Attempting to join ride ${rideId} with user ${userId}`);

    // Check if ride exists and is active
    const [rides] = await db.execute(
      "SELECT * FROM rides WHERE id = ? AND status = ?",
      [rideId, "active"]
    );

    if (rides.length === 0) {
      console.log(`❌ Ride ${rideId} not found or not active`);
      return res.status(404).json({ message: "Ride not found or not active" });
    }

    const ride = rides[0];
    console.log(
      `✅ Found ride: ${ride.destination} (${ride.current_seats}/${ride.max_seats})`
    );

    // Check if user is already a participant
    const [existingParticipants] = await db.execute(
      "SELECT id FROM ride_participants WHERE ride_id = ? AND user_id = ?",
      [rideId, userId]
    );

    if (existingParticipants.length > 0) {
      console.log(`❌ User ${userId} already in ride ${rideId}`);
      return res.status(400).json({ message: "You are already in this ride" });
    }

    // Check if ride is full
    const [participantCount] = await db.execute(
      "SELECT COUNT(*) as count FROM ride_participants WHERE ride_id = ?",
      [rideId]
    );

    const currentParticipants = participantCount[0].count;
    console.log(
      `📊 Current participants: ${currentParticipants}, Max seats: ${ride.max_seats}`
    );

    if (currentParticipants >= ride.max_seats) {
      console.log(`❌ Ride ${rideId} is full`);
      return res.status(400).json({ message: "Ride is full" });
    }

    // Add user to ride
    await db.execute(
      "INSERT INTO ride_participants (ride_id, user_id) VALUES (?, ?)",
      [rideId, userId]
    );

    // Update ride status if full
    const newCount = participantCount[0].count + 1;
    if (newCount >= ride.max_seats) {
      await db.execute(
        "UPDATE rides SET status = ?, current_seats = ? WHERE id = ?",
        ["full", newCount, rideId]
      );
    } else {
      await db.execute("UPDATE rides SET current_seats = ? WHERE id = ?", [
        newCount,
        rideId,
      ]);
    }

    res.json({ message: "Successfully joined the ride" });
  } catch (error) {
    console.error("Join ride error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Leave a ride
router.post("/:id/leave", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.userId;

    // Check if user is a participant
    const [participants] = await db.execute(
      "SELECT id FROM ride_participants WHERE ride_id = ? AND user_id = ?",
      [rideId, userId]
    );

    if (participants.length === 0) {
      return res.status(400).json({ message: "You are not in this ride" });
    }

    // Check if user is the creator
    const [rides] = await db.execute(
      "SELECT creator_id FROM rides WHERE id = ?",
      [rideId]
    );

    if (rides.length === 0) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = rides[0];

    if (ride.creator_id === userId) {
      // If creator leaves, cancel the entire ride
      await db.execute("UPDATE rides SET status = ? WHERE id = ?", [
        "cancelled",
        rideId,
      ]);

      await db.execute("DELETE FROM ride_participants WHERE ride_id = ?", [
        rideId,
      ]);
    } else {
      // Remove user from ride
      await db.execute(
        "DELETE FROM ride_participants WHERE ride_id = ? AND user_id = ?",
        [rideId, userId]
      );

      // Update ride status and count
      const [participantCount] = await db.execute(
        "SELECT COUNT(*) as count FROM ride_participants WHERE ride_id = ?",
        [rideId]
      );

      await db.execute(
        "UPDATE rides SET status = ?, current_seats = ? WHERE id = ?",
        ["active", participantCount[0].count, rideId]
      );
    }

    res.json({ message: "Successfully left the ride" });
  } catch (error) {
    console.error("Leave ride error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get popular destinations
router.get("/destinations/popular", authenticateToken, async (req, res) => {
  try {
    const [destinations] = await db.execute(
      "SELECT destination, count FROM popular_destinations ORDER BY count DESC LIMIT 10"
    );

    res.json({ destinations });
  } catch (error) {
    console.error("Get popular destinations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Debug endpoint - get specific ride details
router.get("/:id/debug", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;

    // Get ride details
    const [rides] = await db.execute(
      `SELECT 
        r.*,
        u.name as creator_name,
        (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as participant_count
      FROM rides r
      JOIN users u ON r.creator_id = u.id
      WHERE r.id = ?`,
      [rideId]
    );

    if (rides.length === 0) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Get participants
    const [participants] = await db.execute(
      `SELECT 
        rp.*,
        u.name, u.email 
      FROM ride_participants rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.ride_id = ?`,
      [rideId]
    );

    res.json({
      ride: rides[0],
      participants: participants,
      canJoin:
        rides[0].status === "active" &&
        participants.length < rides[0].max_seats,
    });
  } catch (error) {
    console.error("Debug ride error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete ride with ownership transfer
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id: rideId } = req.params;
  const userId = req.user.id;

  try {
    // Start transaction
    await db.execute("START TRANSACTION");

    // Get ride details and check ownership
    const [rides] = await db.execute(
      "SELECT * FROM rides WHERE id = ? AND creator_id = ?",
      [rideId, userId]
    );

    if (rides.length === 0) {
      await db.execute("ROLLBACK");
      return res.status(404).json({ message: "Ride not found or you don't have permission to delete it" });
    }

    const ride = rides[0];

    // Get participants (excluding creator)
    const [participants] = await db.execute(
      `SELECT rp.*, u.name, u.email 
       FROM ride_participants rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.ride_id = ? 
       ORDER BY rp.joined_at ASC`,
      [rideId]
    );

    if (participants.length > 0) {
      // Transfer ownership to the first participant who joined
      const newOwner = participants[0];
      
      await db.execute(
        "UPDATE rides SET creator_id = ? WHERE id = ?",
        [newOwner.user_id, rideId]
      );

      // Remove the new owner from participants table
      await db.execute(
        "DELETE FROM ride_participants WHERE ride_id = ? AND user_id = ?",
        [rideId, newOwner.user_id]
      );

      // Send notification to new owner (you can implement this)
      console.log(`Ride ownership transferred to ${newOwner.name} for ride ${rideId}`);

      await db.execute("COMMIT");
      res.json({ 
        message: `Ride ownership transferred to ${newOwner.name}`,
        newOwner: newOwner.name
      });
    } else {
      // No participants, safe to delete the ride
      await db.execute("DELETE FROM ride_messages WHERE ride_id = ?", [rideId]);
      await db.execute("DELETE FROM rides WHERE id = ?", [rideId]);

      await db.execute("COMMIT");
      res.json({ message: "Ride deleted successfully" });
    }

  } catch (error) {
    await db.execute("ROLLBACK");
    console.error("Delete ride error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Manual cleanup endpoint (admin only)
router.post("/cleanup", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you can implement admin check based on your user model)
    const [user] = await db.execute("SELECT role FROM users WHERE id = ?", [req.user.id]);
    
    if (user.length === 0 || user[0].role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    console.log(`Manual cleanup triggered by admin user ${req.user.id}`);
    await cleanupExpiredRides();
    
    res.json({ message: "Cleanup completed successfully" });
  } catch (error) {
    console.error("Manual cleanup error:", error);
    res.status(500).json({ message: "Cleanup failed" });
  }
});

// Get cleanup status and statistics
router.get("/admin/cleanup-status", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const [user] = await db.execute("SELECT role FROM users WHERE id = ?", [req.user.id]);
    
    if (user.length === 0 || user[0].role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get current time in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const currentDate = istTime.toISOString().split("T")[0];
    const currentTime = istTime.toTimeString().split(" ")[0].substring(0, 5);

    // Count total rides
    const [totalRides] = await db.execute("SELECT COUNT(*) as count FROM rides");
    
    // Count active rides
    const [activeRides] = await db.execute("SELECT COUNT(*) as count FROM rides WHERE status = 'active'");
    
    // Count expired rides that need cleanup
    const [expiredRides] = await db.execute(
      `SELECT COUNT(*) as count FROM rides 
       WHERE status = 'active' 
       AND (date < ? OR (date = ? AND time_window_end < ?))`,
      [currentDate, currentDate, currentTime]
    );

    res.json({
      currentTime: istTime.toISOString(),
      totalRides: totalRides[0].count,
      activeRides: activeRides[0].count,
      expiredRidesNeedingCleanup: expiredRides[0].count,
      cleanupInterval: "5 minutes",
      timezone: "IST (UTC+5:30)"
    });
  } catch (error) {
    console.error("Cleanup status error:", error);
    res.status(500).json({ message: "Failed to get cleanup status" });
  }
});

export default router;
