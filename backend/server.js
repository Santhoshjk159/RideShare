import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

// Import routes
import authRoutes from "./routes/auth.js";
import rideRoutes from "./routes/rides.js";
import userRoutes from "./routes/users.js";

// Import socket handlers
import { handleSocketConnection } from "./utils/socketHandlers.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "campus_rideshare",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
};

export const db = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
}

// Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting - reasonable limits for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 50, // limit each IP to 50 requests per minute
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === "/health",
});

app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging for development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/users", userRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  handleSocketConnection(socket, io);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Function to clean up expired rides
async function cleanupExpiredRides() {
  try {
    // Get current time in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);

    const currentDate = istTime.toISOString().split("T")[0]; // YYYY-MM-DD format
    const currentTime = istTime.toTimeString().split(" ")[0].substring(0, 5); // HH:MM format

    console.log(`[${istTime.toISOString()}] Running cleanup for expired rides...`);
    console.log(`Current IST Date: ${currentDate}, Time: ${currentTime}`);

    // Find expired rides (where end time has passed)
    const [expiredRides] = await db.execute(
      `
      SELECT id, destination, date, time_window_end, creator_id
      FROM rides 
      WHERE status = 'active' 
      AND (
        date < ? 
        OR (date = ? AND time_window_end < ?)
      )
    `,
      [currentDate, currentDate, currentTime]
    );

    if (expiredRides.length > 0) {
      console.log(`Found ${expiredRides.length} expired rides to clean up:`, expiredRides);

      for (const ride of expiredRides) {
        // Start transaction for each ride
        await db.execute("START TRANSACTION");

        try {
          // Check if ride has participants
          const [participants] = await db.execute(
            `SELECT rp.*, u.name, u.email 
             FROM ride_participants rp
             JOIN users u ON rp.user_id = u.id
             WHERE rp.ride_id = ? 
             ORDER BY rp.joined_at ASC`,
            [ride.id]
          );

          if (participants.length > 0) {
            // If there are participants, mark the ride as completed
            // This preserves the ride for history but removes it from active rides
            await db.execute(
              "UPDATE rides SET status = 'completed' WHERE id = ?",
              [ride.id]
            );

            console.log(`Ride ${ride.id} marked as completed (${participants.length} participants)`);
          } else {
            // No participants, safe to delete the ride completely
            await db.execute("DELETE FROM ride_messages WHERE ride_id = ?", [ride.id]);
            await db.execute("DELETE FROM rides WHERE id = ?", [ride.id]);
            console.log(`Ride ${ride.id} deleted (no participants)`);
          }

          await db.execute("COMMIT");
        } catch (error) {
          await db.execute("ROLLBACK");
          console.error(`Error processing expired ride ${ride.id}:`, error);
        }
      }
    } else {
      console.log("No expired rides found");
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

// Start server
server.listen(PORT, async () => {
  await testConnection();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
  );
  
  // Run initial cleanup
  console.log("🧹 Running initial ride cleanup...");
  await cleanupExpiredRides();
  
  // Schedule cleanup to run every 5 minutes for more responsive cleanup
  setInterval(async () => {
    console.log("🧹 Running scheduled ride cleanup...");
    await cleanupExpiredRides();
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
  
  console.log("⏰ Automatic ride cleanup scheduled every 5 minutes (IST)");
});

export { io, cleanupExpiredRides };
