import bcrypt from "bcryptjs";

async function generateHash() {
  try {
    const password = "admin123";
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);

    console.log("\n=== ADMIN PASSWORD HASH ===");
    console.log("Password:", password);
    console.log("Hash:", hash);
    console.log("\n=== SQL COMMAND ===");
    console.log(
      `UPDATE users SET password = '${hash}' WHERE email = 'adminjks@gmail.com';`
    );
    console.log("\nOr if user doesn't exist:");
    console.log(
      `INSERT INTO users (name, email, password, role) VALUES ('Admin User', 'adminjks@gmail.com', '${hash}', 'admin');`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

generateHash();
