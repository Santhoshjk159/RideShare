-- Complete PostgreSQL Setup for CampusCruze Ride Share (Supabase)
-- Run this file in Supabase SQL editor to set up the entire database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL,
  destination VARCHAR(255) NOT NULL,
  pickup_location VARCHAR(255),
  date DATE NOT NULL,
  time_window_start TIME NOT NULL,
  time_window_end TIME NOT NULL,
  max_seats INTEGER NOT NULL DEFAULT 6,
  current_seats INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'full', 'completed', 'cancelled')),
  notes TEXT,
  completed_by INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Ride participants table
CREATE TABLE IF NOT EXISTS ride_participants (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(ride_id, user_id)
);

-- Messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rides_creator ON rides(creator_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_date ON rides(date);
CREATE INDEX IF NOT EXISTS idx_participants_ride ON ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON ride_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_ride ON messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default admin user (password: admin123)
-- Using ON CONFLICT to avoid duplicates
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@campuscruze.com', '$2a$12$0ZJc141LkEr7.uw0kYBaY.xbwoY2Ot3zOEK4UGVpOt79.kuyYhgHC', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Verify setup
SELECT 'PostgreSQL database setup completed successfully for CampusCruze' as status;
