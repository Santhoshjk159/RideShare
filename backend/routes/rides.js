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
  maxSeats: z.number().min(6).max(6).default(6),
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
        completed_user.name as completed_by_name,
        (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as participant_count
      FROM rides r
      JOIN users u ON r.creator_id = u.id
      LEFT JOIN users completed_user ON r.completed_by = completed_user.id
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
      filteredRides = rides.filter(
        (ride) => !isRideExpired(ride.date, ride.time_window_end)
      );
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
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test endpoint to verify server is running updated code
router.get("/test", (req, res) => {
  res.json({
    message: "Routes are working! Updated at " + new Date().toISOString(),
    timestamp: Date.now(),
  });
});

// Get user's pending/waiting rides
router.get("/my-requests", authenticateToken, async (req, res) => {
  try {
    // Use fallback to req.userId if req.user.id is not available
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in token" });
    }

    const [waitingRides] = await db.execute(
      `SELECT r.*, u.name as creator_name
       FROM rides r
       JOIN users u ON r.creator_id = u.id
       WHERE r.creator_id = ? AND r.status = 'waiting'
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({ rides: waitingRides });
  } catch (error) {
    res.status(500).json({ message: "Failed to get ride requests" });
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
        u.email as creator_email,
        completed_user.name as completed_by_name
      FROM rides r
      JOIN users u ON r.creator_id = u.id
      LEFT JOIN users completed_user ON r.completed_by = completed_user.id
      WHERE r.id = ?
    `,
      [rideId]
    );

    if (rides.length === 0) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = rides[0];

    // Get participants
    try {
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
    } catch (participantError) {
      ride.participants = [];
    }

    // Get chat messages (make this optional in case table doesn't exist)
    try {
      const [messages] = await db.execute(
        `
        SELECT rm.id, rm.message, rm.created_at, u.name as user_name, u.id as user_id
        FROM ride_messages rm
        JOIN users u ON rm.user_id = u.id
        WHERE rm.ride_id = ?
        ORDER BY rm.created_at ASC
      `,
        [rideId]
      );
      ride.messages = messages;
    } catch (messageError) {
      ride.messages = [];
    }

    res.json({ ride });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Create new ride
router.post("/", authenticateToken, async (req, res) => {
  try {
    const data = createRideSchema.parse(req.body);
    
    // Always force maxSeats to 6 regardless of what client sends
    data.maxSeats = 6;

    // Check for existing matching rides using destination grouping
    const destGroup = getDestinationGroup(data.destination);

    // Build destination conditions for checking existing rides
    let destinationConditions = [];
    let destinationParams = [];

    // Add exact match
    destinationConditions.push("LOWER(r.destination) = LOWER(?)");
    destinationParams.push(data.destination);

    // Add group matches
    if (destGroup.group !== "other") {
      destGroup.destinations.forEach((dest) => {
        if (dest !== data.destination) {
          destinationConditions.push("LOWER(r.destination) = LOWER(?)");
          destinationParams.push(dest);
        }
      });
    }

    // Add overlapping group matches
    if (destGroup.group === "transport_hub" || destGroup.group === "shopping") {
      const otherGroup =
        destGroup.group === "transport_hub" ? "shopping" : "transport_hub";
      const overlappingDests = DESTINATION_GROUPS[otherGroup].filter((d) =>
        destGroup.destinations.includes(d)
      );
      overlappingDests.forEach((dest) => {
        if (!destinationParams.includes(dest)) {
          destinationConditions.push("LOWER(r.destination) = LOWER(?)");
          destinationParams.push(dest);
        }
      });
    }

    const destinationSQL = destinationConditions.join(" OR ");

    const [existingRides] = await db.execute(
      `SELECT id, destination FROM rides r
       WHERE date = ? 
       AND status = 'active'
       AND (${destinationSQL})
       AND (
         (time_window_start <= ? AND time_window_end >= ?) OR
         (time_window_start <= ? AND time_window_end >= ?) OR
         (time_window_start >= ? AND time_window_end <= ?)
       )`,
      [
        data.date,
        ...destinationParams,
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
        message: `A matching ride already exists for this time window (${existingRides[0].destination})`,
        existingRideId: existingRides[0].id,
      });
    }

    // Create new ride
    const [result] = await db.execute(
      `
      INSERT INTO rides (
        creator_id, destination, pickup_location, 
        time_window_start, time_window_end, date, 
        max_seats, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
      [
        req.userId,
        data.destination,
        data.pickupLocation || null,
        data.timeWindowStart,
        data.timeWindowEnd,
        data.date,
        6, // Always use 6 seats
        data.notes || null,
      ]
    );

    const rideId = result.insertId;

    // Note: Creator is not added as participant at creation time
    // They will be automatically added when the first person joins the ride

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
      ride: rides[0],    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Join a ride
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.userId;

    // Check if ride exists and is active
    const [rides] = await db.execute(
      "SELECT * FROM rides WHERE id = ? AND status = ?",
      [rideId, "active"]
    );

    if (rides.length === 0) {
      return res.status(404).json({ message: "Ride not found or not active" });
    }

    const ride = rides[0];

    // Check if user is the creator
    if (ride.creator_id === parseInt(userId)) {
      return res
        .status(400)
        .json({
          message: "As the ride creator, you are automatically added when someone joins your ride",
        });
    }

    // Check if user is already a participant
    const [existingParticipants] = await db.execute(
      "SELECT id FROM ride_participants WHERE ride_id = ? AND user_id = ?",
      [rideId, userId]
    );

    if (existingParticipants.length > 0) {
      return res
        .status(400)
        .json({ message: "You have already joined this ride" });
    }

    // Get current participant count
    const [participantCount] = await db.execute(
      "SELECT COUNT(*) as count FROM ride_participants WHERE ride_id = ?",
      [rideId]
    );

    const currentParticipants = participantCount[0].count;

    // Check if this is the first person joining (creator not yet added)
    const isFirstJoin = currentParticipants === 0;

    // Check if ride would be full after adding both user and creator (if first join)
    const seatsNeeded = isFirstJoin ? 2 : 1; // User + creator if first join, otherwise just user
    
    if (currentParticipants + seatsNeeded > ride.max_seats) {
      return res.status(400).json({ message: "Ride is full" });
    }

    // Add the joining user to ride
    await db.execute(
      "INSERT INTO ride_participants (ride_id, user_id, joined_at) VALUES (?, ?, NOW())",
      [rideId, userId]
    );

    let newCount = currentParticipants + 1;

    // If this is the first join, also add the creator as a participant
    if (isFirstJoin) {
      await db.execute(
        "INSERT INTO ride_participants (ride_id, user_id, joined_at) VALUES (?, ?, NOW())",
        [rideId, ride.creator_id]
      );
      newCount = currentParticipants + 2; // Both user and creator added
    }
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
      // If creator leaves, transfer ownership to the next participant
      const [nextParticipants] = await db.execute(
        `SELECT user_id FROM ride_participants 
         WHERE ride_id = ? AND user_id != ? 
         ORDER BY joined_at ASC 
         LIMIT 1`,
        [rideId, userId]
      );

      if (nextParticipants.length > 0) {
        // Transfer ownership to the next participant
        const newCreatorId = nextParticipants[0].user_id;

        await db.execute("UPDATE rides SET creator_id = ? WHERE id = ?", [
          newCreatorId,
          rideId,
        ]);

        // Remove the original creator from participants
        await db.execute(
          "DELETE FROM ride_participants WHERE ride_id = ? AND user_id = ?",
          [rideId, userId]
        );

        // Update ride status and participant count
        const [participantCount] = await db.execute(
          "SELECT COUNT(*) as count FROM ride_participants WHERE ride_id = ?",
          [rideId]
        );

        await db.execute("UPDATE rides SET current_seats = ? WHERE id = ?", [
          participantCount[0].count,
          rideId,
        ]);

        // Get the new creator's name for response message
        const [newCreator] = await db.execute(
          "SELECT name FROM users WHERE id = ?",
          [newCreatorId]
        );

        res.json({
          message: `Successfully left the ride. Ownership transferred to ${newCreator[0].name}`,
          newCreator: newCreator[0].name,
        });
      } else {
        // No other participants, cancel the ride
        await db.execute("UPDATE rides SET status = ? WHERE id = ?", [
          "cancelled",
          rideId,
        ]);

        await db.execute("DELETE FROM ride_participants WHERE ride_id = ?", [
          rideId,
        ]);

        res.json({
          message: "Ride cancelled as no other participants were available",
        });
      }
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

      res.json({ message: "Successfully left the ride" });
    }
  } catch (error) {
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
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete ride - simplified version
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.userId;

    // Check if ride exists and user owns it
    const [rides] = await db.execute(
      "SELECT * FROM rides WHERE id = ? AND creator_id = ?",
      [rideId, userId]
    );

    if (rides.length === 0) {
      return res.status(404).json({ 
        message: "Ride not found or you don't have permission to delete it" 
      });
    }

    const ride = rides[0];

    // Don't allow deleting completed rides
    if (ride.status === "completed") {
      return res.status(400).json({ 
        message: "Cannot delete completed rides" 
      });
    }

    // Check if there are other participants (not including creator)
    const [participants] = await db.execute(
      "SELECT COUNT(*) as count FROM ride_participants WHERE ride_id = ? AND user_id != ?",
      [rideId, userId]
    );

    if (participants[0].count > 0) {
      return res.status(400).json({ 
        message: "Cannot delete ride with other participants. Please ask them to leave first." 
      });
    }

    // Delete the ride (CASCADE will handle related data)
    await db.execute("DELETE FROM rides WHERE id = ?", [rideId]);

    res.json({ message: "Ride deleted successfully" });
  } catch (error) {
    console.error("Delete ride error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Manual cleanup endpoint (admin only)
router.post("/cleanup", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you can implement admin check based on your user model)
    const [user] = await db.execute("SELECT role FROM users WHERE id = ?", [
      req.userId,
    ]);

    if (user.length === 0 || user[0].role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    await cleanupExpiredRides();

    res.json({ message: "Cleanup completed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Cleanup failed" });
  }
});

// Get cleanup status and statistics
router.get("/admin/cleanup-status", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const [user] = await db.execute("SELECT role FROM users WHERE id = ?", [
      req.userId,
    ]);

    if (user.length === 0 || user[0].role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get current time in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const currentDate = istTime.toISOString().split("T")[0];
    const currentTime = istTime.toTimeString().split(" ")[0].substring(0, 5);

    // Count total rides
    const [totalRides] = await db.execute(
      "SELECT COUNT(*) as count FROM rides"
    );

    // Count active rides
    const [activeRides] = await db.execute(
      "SELECT COUNT(*) as count FROM rides WHERE status = 'active'"
    );

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
      timezone: "IST (UTC+5:30)",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get cleanup status" });
  }
});

// Smart ride matching endpoint
router.post("/match", authenticateToken, async (req, res) => {
  try {
    const {
      destination,
      pickupLocation,
      timeWindowStart,
      timeWindowEnd,
      date,
      maxSeats,
      notes,
    } = req.body;
    const userId = req.userId;
    
    // Always force maxSeats to 6
    const forcedMaxSeats = 6;

    // First, try to find matching existing rides
    const matches = await findMatchingRides(
      destination,
      timeWindowStart,
      timeWindowEnd,
      date,
      userId
    );

    if (matches.length > 0) {
      // Found matches! Return them for user to choose
      return res.json({
        success: true,
        hasMatches: true,
        matches: matches,
        message: "Great! We found matching rides for you.",
      });
    } else {
      // No matches found, create a ride request and wait for matches

      const [result] = await db.execute(
        `INSERT INTO rides (destination, pickup_location, time_window_start, time_window_end, date, max_seats, notes, creator_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting')`,
        [
          destination,
          pickupLocation || null,
          timeWindowStart,
          timeWindowEnd,
          date,
          forcedMaxSeats, // Always use 6 seats
          notes || null,
          userId,
        ]
      );

      // Now check if this new ride matches with any existing waiting rides
      const waitingMatches = await findMatchingRides(
        destination,
        timeWindowStart,
        timeWindowEnd,
        date,
        userId
      );

      if (waitingMatches.length > 0) {
        // Update the ride status to active since we found matches
        await db.execute("UPDATE rides SET status = 'active' WHERE id = ?", [
          result.insertId,
        ]);

        return res.json({
          success: true,
          hasMatches: true,
          matches: waitingMatches,
          rideId: result.insertId,
          message:
            "Perfect timing! We found matching rides while you were submitting.",
        });
      }

      return res.json({
        success: true,
        hasMatches: false,
        rideId: result.insertId,
        message:
          "Your ride request is submitted! We'll notify you when we find matching rides.",
        status: "waiting",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to process ride matching" });
  }
});

// Helper function to find matching rides
// Destination grouping configuration
const DESTINATION_GROUPS = {
  // Group 1: Railway station, Bus stand, Vijetha Mart, Connplex cinema, Highway
  transport_hub: [
    "Railway Station",
    "Bus Stand",
    "Vijetha Mart",
    "Connplex Cinemas",
    "Tadepalligudem Highway",
  ],
  // Group 2: NIT Back Gate (standalone)
  nit_back: ["NIT Back Gate"],
  // Group 3: NIT Front Gate (standalone)
  nit_front: ["NIT Front Gate"],
  // Group 4: Shopping areas
  shopping: [
    "Bus Stand",
    "Vijetha Mart",
    "Connplex Cinemas",
    "Jio Mart",
    "GV Mall",
  ],
  // Group 5: Theatres (separate)
  theatres: ["Sri Ranga Mahal Theatre", "Sri Seshmahal Theatre"],
};

// Function to get destination group
function getDestinationGroup(destination) {
  for (const [groupName, destinations] of Object.entries(DESTINATION_GROUPS)) {
    if (destinations.includes(destination)) {
      return { group: groupName, destinations };
    }
  }
  return { group: "other", destinations: [destination] };
}

// Function to check if two destinations are compatible
function areDestinationsCompatible(dest1, dest2) {
  const group1 = getDestinationGroup(dest1);
  const group2 = getDestinationGroup(dest2);

  // Exact match
  if (dest1 === dest2) {
    return true;
  }

  // Same group
  if (group1.group === group2.group) {
    return true;
  }

  // Special case: transport_hub and shopping overlap
  if (
    (group1.group === "transport_hub" && group2.group === "shopping") ||
    (group1.group === "shopping" && group2.group === "transport_hub")
  ) {
    // Check if there's any overlap in destinations
    const overlap = group1.destinations.filter((d) =>
      group2.destinations.includes(d)
    );
    return overlap.length > 0;
  }

  return false;
}

async function findMatchingRides(
  destination,
  timeStart,
  timeEnd,
  date,
  userId
) {
  try {
    // Get compatible destinations for the requested destination
    const destGroup = getDestinationGroup(destination);

    // Build the destination matching conditions
    let destinationConditions = [];
    let destinationParams = [];

    // Add exact match (highest priority)
    destinationConditions.push("LOWER(r.destination) = LOWER(?)");
    destinationParams.push(destination);

    // Add group matches
    if (destGroup.group !== "other") {
      destGroup.destinations.forEach((dest) => {
        if (dest !== destination) {
          destinationConditions.push("LOWER(r.destination) = LOWER(?)");
          destinationParams.push(dest);
        }
      });
    }

    // Add overlapping group matches for transport_hub and shopping
    if (destGroup.group === "transport_hub" || destGroup.group === "shopping") {
      const otherGroup =
        destGroup.group === "transport_hub" ? "shopping" : "transport_hub";
      const overlappingDests = DESTINATION_GROUPS[otherGroup].filter((d) =>
        destGroup.destinations.includes(d)
      );
      overlappingDests.forEach((dest) => {
        if (!destinationParams.includes(dest)) {
          destinationConditions.push("LOWER(r.destination) = LOWER(?)");
          destinationParams.push(dest);
        }
      });
    }

    const destinationSQL = destinationConditions.join(" OR ");

    const [matches] = await db.execute(
      `SELECT 
        r.*,
        u.name as creator_name,
        u.email as creator_email,
        (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as participant_count
      FROM rides r
      JOIN users u ON r.creator_id = u.id
      WHERE r.status IN ('active', 'waiting')
      AND r.creator_id != ?
      AND r.date = ?
      AND (${destinationSQL})
      AND (
        (r.time_window_start <= ? AND r.time_window_end >= ?) OR
        (r.time_window_start <= ? AND r.time_window_end >= ?) OR
        (r.time_window_start >= ? AND r.time_window_end <= ?) OR
        (? >= r.time_window_start AND ? <= r.time_window_end)
      )
      AND (
        (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) < r.max_seats
      )
      ORDER BY 
        CASE 
          WHEN LOWER(r.destination) = LOWER(?) THEN 1
          ELSE 2
        END,
        ABS(TIME_TO_SEC(TIMEDIFF(r.time_window_start, ?))) ASC
      LIMIT 5`,
      [
        userId,
        date,
        ...destinationParams,
        timeStart,
        timeStart,
        timeEnd,
        timeEnd,
        timeStart,
        timeEnd,
        timeStart,
        timeEnd,
        destination,
        timeStart,
      ]
    );

    return matches;
  } catch (error) {
    return [];
  }
}

// Join a matched ride
router.post("/:id/join-match", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.user.id;

    // Check if ride exists and has space
    const [rides] = await db.execute(
      `SELECT r.*, (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as participant_count
       FROM rides r WHERE r.id = ? AND r.status IN ('active', 'waiting')`,
      [rideId]
    );

    if (rides.length === 0) {
      return res
        .status(404)
        .json({ message: "Ride not found or no longer available" });
    }

    const ride = rides[0];

    if (ride.creator_id === userId) {
      return res.status(400).json({ 
        message: "As the ride creator, you are automatically added when someone joins your ride" 
      });
    }

    // Check if this is the first person joining (creator not yet added)
    const isFirstJoin = ride.participant_count === 0;

    // Check if ride would be full after adding both user and creator (if first join)
    const seatsNeeded = isFirstJoin ? 2 : 1; // User + creator if first join, otherwise just user
    
    if (ride.participant_count + seatsNeeded > ride.max_seats) {
      return res.status(400).json({ message: "Ride is full" });
    }

    // Check if already joined
    const [existing] = await db.execute(
      "SELECT id FROM ride_participants WHERE ride_id = ? AND user_id = ?",
      [rideId, userId]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "You have already joined this ride" });
    }

    // Join the ride
    await db.execute(
      "INSERT INTO ride_participants (ride_id, user_id, joined_at) VALUES (?, ?, NOW())",
      [rideId, userId]
    );

    let newParticipantCount = ride.participant_count + 1;

    // If this is the first join, also add the creator as a participant
    if (isFirstJoin) {
      await db.execute(
        "INSERT INTO ride_participants (ride_id, user_id, joined_at) VALUES (?, ?, NOW())",
        [rideId, ride.creator_id]
      );
      newParticipantCount = ride.participant_count + 2; // Both user and creator added
    }
    const newStatus = newParticipantCount >= ride.max_seats ? "full" : "active";

    await db.execute(
      "UPDATE rides SET status = ?, current_seats = ? WHERE id = ?",
      [newStatus, newParticipantCount, rideId]
    );

    res.json({ message: "Successfully joined the ride!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to join ride" });
  }
});

// Mark ride as completed
router.post("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.userId;

    // Check if ride exists and is active
    const [rides] = await db.execute("SELECT * FROM rides WHERE id = ?", [
      rideId,
    ]);

    if (rides.length === 0) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = rides[0];

    // Check if user is the creator or a participant
    const [participants] = await db.execute(
      "SELECT * FROM ride_participants WHERE ride_id = ? AND user_id = ?",
      [rideId, userId]
    );

    const isCreator = ride.creator_id === parseInt(userId);
    const isParticipant = participants.length > 0;

    if (!isCreator && !isParticipant) {
      return res
        .status(403)
        .json({ message: "You are not authorized to complete this ride" });
    }

    if (ride.status === "completed") {
      return res.status(400).json({ message: "Ride is already completed" });
    }

    // Get user info for completion record
    const [users] = await db.execute("SELECT name FROM users WHERE id = ?", [
      userId,
    ]);

    const userName = users[0]?.name || "Unknown User";

    // Mark ride as completed
    await db.execute(
      "UPDATE rides SET status = 'completed', completed_by = ?, completed_at = NOW() WHERE id = ?",
      [userId, rideId]
    );

    res.json({
      message: "Ride marked as completed successfully",
      completedBy: userName,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a ride
export default router;
