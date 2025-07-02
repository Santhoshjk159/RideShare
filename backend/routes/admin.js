import express from "express";
import { db } from "../server.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get admin statistics
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const [userStats] = await db.execute(
      "SELECT COUNT(*) as totalUsers FROM users WHERE role = 'user'"
    );

    // Get total rides
    const [rideStats] = await db.execute(
      "SELECT COUNT(*) as totalRides FROM rides"
    );

    // Get active rides (waiting, active, full status)
    const [activeRideStats] = await db.execute(
      "SELECT COUNT(*) as activeRides FROM rides WHERE status IN ('waiting', 'active', 'full')"
    );

    // Get completed rides
    const [completedRideStats] = await db.execute(
      "SELECT COUNT(*) as completedRides FROM rides WHERE status = 'completed'"
    );

    // Get top destinations
    const [topDestinations] = await db.execute(`
      SELECT destination, COUNT(*) as count 
      FROM rides 
      GROUP BY destination 
      ORDER BY count DESC 
      LIMIT 5
    `);

    // Get rides per day for the last 7 days
    const [ridesPerDay] = await db.execute(`
      SELECT 
        DATE(created_at) as date, 
        COUNT(*) as count 
      FROM rides 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);

    // Format dates for frontend
    const formattedRidesPerDay = ridesPerDay.map(item => ({
      date: item.date.toISOString().split('T')[0],
      count: item.count
    }));

    // Fill in missing days with 0 counts
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingData = formattedRidesPerDay.find(item => item.date === dateStr);
      last7Days.push({
        date: dateStr,
        count: existingData ? existingData.count : 0
      });
    }

    const stats = {
      totalUsers: userStats[0].totalUsers,
      totalRides: rideStats[0].totalRides,
      activeRides: activeRideStats[0].activeRides,
      completedRides: completedRideStats[0].completedRides,
      topDestinations: topDestinations,
      ridesPerDay: last7Days
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin statistics" });
  }
});

// Get recent rides with details
router.get("/recent-rides", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rides] = await db.execute(`
      SELECT 
        r.id,
        r.destination,
        r.pickup_location,
        r.date,
        r.time_window_start,
        r.time_window_end,
        r.max_seats,
        r.current_seats,
        r.status,
        r.created_at,
        u.name as creator_name,
        u.email as creator_email
      FROM rides r
      JOIN users u ON r.creator_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent rides" });
  }
});

// Get recent users
router.get("/recent-users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT 
        id,
        name,
        email,
        created_at,
        (SELECT COUNT(*) FROM rides WHERE creator_id = users.id) as rides_created,
        (SELECT COUNT(*) FROM ride_participants WHERE user_id = users.id) as rides_joined
      FROM users 
      WHERE role = 'user'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent users" });
  }
});

export default router;
