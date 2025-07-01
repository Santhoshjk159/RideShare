-- Campus RideShare Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS campus_rideshare;
USE campus_rideshare;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rides table
CREATE TABLE rides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creator_id INT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    pickup_location VARCHAR(255),
    time_window_start TIME NOT NULL,
    time_window_end TIME NOT NULL,
    date DATE NOT NULL,
    max_seats INT DEFAULT 4,
    current_seats INT DEFAULT 1,
    status ENUM('active', 'full', 'completed', 'cancelled') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_destination (destination),
    INDEX idx_date (date),
    INDEX idx_status (status)
);

-- Ride participants table
CREATE TABLE ride_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ride_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (ride_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ride_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ride_time (ride_id, created_at)
);

-- Popular destinations table (for analytics)
CREATE TABLE popular_destinations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destination VARCHAR(255) UNIQUE NOT NULL,
    count INT DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some sample data

-- Sample admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@campus.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/4gvjvTJfKz.YOKdBu', 'admin');

-- Sample destinations
INSERT INTO popular_destinations (destination, count) VALUES 
('University Library', 15),
('Shopping Mall', 12),
('Train Station', 8),
('Airport', 5),
('Bus Terminal', 7),
('City Center', 10),
('Hospital', 3),
('Movie Theater', 6);

-- Sample student users
INSERT INTO users (name, email, password, role) VALUES 
('John Doe', 'john@campus.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/4gvjvTJfKz.YOKdBu', 'student'),
('Jane Smith', 'jane@campus.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/4gvjvTJfKz.YOKdBu', 'student'),
('Mike Johnson', 'mike@campus.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/4gvjvTJfKz.YOKdBu', 'student');

-- Sample rides
INSERT INTO rides (creator_id, destination, pickup_location, time_window_start, time_window_end, date, max_seats, current_seats) VALUES 
(2, 'Shopping Mall', 'Main Gate', '18:00:00', '19:00:00', CURDATE(), 4, 2),
(3, 'Train Station', 'Library', '09:00:00', '10:00:00', CURDATE(), 3, 1),
(4, 'Airport', 'Hostel Block A', '06:00:00', '07:00:00', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 4, 1);

-- Add participants to rides
INSERT INTO ride_participants (ride_id, user_id) VALUES 
(1, 2), -- Creator is always a participant
(1, 3), -- Jane joins John's ride
(2, 3), -- Creator
(3, 4); -- Creator
