-- Script to add admin role to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user';

-- Update a specific user to be admin (replace email with your admin email)
UPDATE users SET role = 'admin' WHERE email = 'admin@campuscruze.com';

-- Alternative: Create a new admin user (adjust details as needed)
-- INSERT INTO users (name, email, password, role) 
-- VALUES ('Admin User', 'admin@campuscruze.com', '$2b$10$hashedPasswordHere', 'admin');
