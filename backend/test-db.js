import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testDatabaseConnection() {
  console.log("Testing database connection...");
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_NAME:", process.env.DB_NAME);
  console.log("DB_PORT:", process.env.DB_PORT);

  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "campus_rideshare",
  };

  try {
    console.log("Attempting to connect with config:", {
      ...dbConfig,
      password: "***", // Hide password in logs
    });

    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Successfully connected to MySQL database!");

    // Test if database exists
    const [rows] = await connection.execute("SELECT DATABASE() as db_name");
    console.log("✅ Current database:", rows[0].db_name);

    // Test if tables exist
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(
      "📋 Tables in database:",
      tables.map((t) => Object.values(t)[0])
    );

    await connection.end();
    console.log("✅ Connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Specific error guidance
    if (error.code === "ENOTFOUND") {
      console.log("\n🔍 ENOTFOUND Error - This usually means:");
      console.log("1. MySQL server is not running");
      console.log('2. Wrong hostname (should be "localhost" for local MySQL)');
      console.log("3. Network connectivity issues");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n🔍 Access Denied - Check:");
      console.log("1. Username and password are correct");
      console.log("2. User has permissions to access the database");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\n🔍 Database does not exist - Run this SQL:");
      console.log("CREATE DATABASE IF NOT EXISTS campus_rideshare;");
    }
  }
}

testDatabaseConnection();
