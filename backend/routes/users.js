import express from "express";
import { db } from "../server.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Get user's ride history
    const [rides] = await db.execute(
      `
      SELECT r.*, 
        (CASE WHEN r.creator_id = ? THEN 'created' ELSE 'joined' END) as participation_type
      FROM rides r
      LEFT JOIN ride_participants rp ON r.id = rp.ride_id
      WHERE r.creator_id = ? OR rp.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `,
      [req.userId, req.userId, req.userId]
    );

    res.json({
      user,
      rideHistory: rides,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    // Get created rides count
    const [createdRides] = await db.execute(
      "SELECT COUNT(*) as count FROM rides WHERE creator_id = ?",
      [req.userId]
    );

    // Get joined rides count
    const [joinedRides] = await db.execute(
      "SELECT COUNT(*) as count FROM ride_participants WHERE user_id = ? AND ride_id NOT IN (SELECT id FROM rides WHERE creator_id = ?)",
      [req.userId, req.userId]
    );

    // Get completed rides count
    const [completedRides] = await db.execute(
      `
      SELECT COUNT(*) as count FROM rides r
      LEFT JOIN ride_participants rp ON r.id = rp.ride_id
      WHERE (r.creator_id = ? OR rp.user_id = ?) AND r.status = 'completed'
    `,
      [req.userId, req.userId]
    );

    res.json({
      createdRides: createdRides[0].count,
      joinedRides: joinedRides[0].count,
      completedRides: completedRides[0].count,
      totalRides: createdRides[0].count + joinedRides[0].count,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
