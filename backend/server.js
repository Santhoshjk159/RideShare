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
import adminRoutes from "./routes/admin.js";

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
const isDevelopment = process.env.NODE_ENV !== "production";

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
    // Database connected successfully
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

// Development-friendly rate limiting
if (isDevelopment) {
  // Development mode: Rate limiting disabled
  // Very lenient rate limiting for development
  const devLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10000, // Very high limit for development
    message: {
      error: "Rate limit reached (dev mode)",
      retryAfter: 60,
    },
    skip: () => true, // Skip all rate limiting in development
  });
  app.use(devLimiter);
} else {
  // Production rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: 900,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: {
      error: "Too many login attempts, please try again later.",
      retryAfter: 900,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  app.use(limiter);
  app.use("/api/auth", authLimiter);
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging for debugging
if (isDevelopment) {
  app.use((req, res, next) => {
    // Log requests in development only
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mode: isDevelopment ? "development" : "production",
  });
});

// API Routes
// Registering API routes...
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
// API routes registered

// Socket.IO connection handling
io.on("connection", (socket) => {
  handleSocketConnection(socket, io);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: isDevelopment ? err.message : {},
  });
});

// 404 handler
app.use("*", (req, res) => {
  if (isDevelopment) {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  }
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
      // Process expired rides

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
            await db.execute(
              "UPDATE rides SET status = 'completed' WHERE id = ?",
              [ride.id]
            );
          } else {
            // No participants, safe to delete the ride completely
            await db.execute("DELETE FROM ride_messages WHERE ride_id = ?", [
              ride.id,
            ]);
            await db.execute("DELETE FROM rides WHERE id = ?", [ride.id]);
          }

          await db.execute("COMMIT");
        } catch (error) {
          await db.execute("ROLLBACK");
          if (isDevelopment) {
            console.error(`Error processing expired ride ${ride.id}:`, error);
          }
        }
      }
    }
  } catch (error) {
    if (isDevelopment) {
      console.error("Error during cleanup:", error);
    }
  }
}

// Start server
server.listen(PORT, async () => {
  await testConnection();
  console.log(`🚀 Server running on port ${PORT}`);
  if (isDevelopment) {
    console.log(
      `📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
    );
    console.log(
      `🔧 Environment: ${isDevelopment ? "Development" : "Production"}`
    );
  }

  // Run initial cleanup
  await cleanupExpiredRides();

  // Schedule cleanup to run every 5 minutes
  setInterval(async () => {
    await cleanupExpiredRides();
  }, 5 * 60 * 1000); // 5 minutes
});

export { io, cleanupExpiredRides };
