-- Modified Database Setup for MySQL Free Database
-- Compatible with older MySQL versions that have TIMESTAMP limitations
-- Database: sql12788792

USE sql12788792;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS ride_participants;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS users;

-- Users table (only one TIMESTAMP with CURRENT_TIMESTAMP)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user', 'admin') DEFAULT 'user',
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

-- Rides table
CREATE TABLE rides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  destination VARCHAR(255) NOT NULL,
  pickup_location VARCHAR(255),
  date DATE NOT NULL,
  time_window_start TIME NOT NULL,
  time_window_end TIME NOT NULL,
  max_seats INT NOT NULL DEFAULT 6,
  current_seats INT DEFAULT 0,
  status ENUM('waiting', 'active', 'full', 'completed', 'cancelled') DEFAULT 'waiting',
  notes TEXT,
  completed_by INT NULL,
  completed_at DATETIME NULL,
  created_at DATETIME DEFAULT NULL,
  updated_at DATETIME DEFAULT NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Ride participants table
CREATE TABLE ride_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
  joined_at DATETIME DEFAULT NULL,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ride_user (ride_id, user_id)
);

-- Messages table for chat functionality
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT NULL,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_rides_creator ON rides(creator_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_date ON rides(date);
CREATE INDEX idx_participants_ride ON ride_participants(ride_id);
CREATE INDEX idx_participants_user ON ride_participants(user_id);
CREATE INDEX idx_messages_ride ON messages(ride_id);
CREATE INDEX idx_users_email ON users(email);

-- Insert default admin user (password: admin123)
-- Email: admin@campuscruze.com, Password: admin123
INSERT INTO users (name, email, password, role, created_at) VALUES 
('Admin User', 'admin@campuscruze.com', '$2a$12$0ZJc141LkEr7.uw0kYBaY.xbwoY2Ot3zOEK4UGVpOt79.kuyYhgHC', 'admin', NOW());

-- Database setup complete
SELECT 'CampusCruze database setup completed successfully' as status;
