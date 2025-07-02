import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../server.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Helper functions
const generateTokens = (userId, userInfo = {}) => {
  const payload = { userId, ...userInfo };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE,
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });

  return { accessToken, refreshToken };
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, "user"]
    );

    const userId = result.insertId;

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userId, {
      email,
      name,
      role: "user",
    });

    // Store refresh token in database
    await db.execute("UPDATE users SET refresh_token = ? WHERE id = ?", [
      refreshToken,
      userId,
    ]);

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Get user data (without password)
    const [users] = await db.execute(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [userId]
    );

    res.status(201).json({
      message: "User created successfully",
      user: users[0],
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    console.log("🔐 Login attempt:", { email: req.body.email });

    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const [users] = await db.execute(
      "SELECT id, name, email, password, role FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    console.log("✅ Found user:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("❌ Invalid password for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ Password verified for:", email);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
    });
    console.log("✅ Tokens generated for user:", user.id);

    // Store refresh token in database
    await db.execute("UPDATE users SET refresh_token = ? WHERE id = ?", [
      refreshToken,
      user.id,
    ]);
    console.log("✅ Refresh token stored in database");

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    console.log("✅ Refresh token cookie set");

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    console.log("✅ Login successful for:", email);
    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not provided" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const [users] = await db.execute(
      "SELECT id, name, email, role FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.userId, refreshToken]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const { accessToken } = generateTokens(decoded.userId);

    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Remove refresh token from database
    await db.execute("UPDATE users SET refresh_token = NULL WHERE id = ?", [
      req.userId,
    ]);

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
