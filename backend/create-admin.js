import bcrypt from "bcryptjs";
import { db } from "./server.js";
import dotenv from "dotenv";

dotenv.config();

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    // Check if admin already exists
    const [existingAdmin] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      ["admin@campus.edu"]
    );

    if (existingAdmin.length > 0) {
      console.log("❌ Admin user already exists!");
      console.log("Try logging in with: admin@campus.edu / admin123");
      return;
    }

    // Hash the password 'admin123'
    const password = "admin123";
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log("Generated password hash:", hashedPassword);

    // Create admin user
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin User", "admin@campus.edu", hashedPassword, "admin"]
    );

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@campus.edu");
    console.log("🔑 Password: admin123");
    console.log("👤 User ID:", result.insertId);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
