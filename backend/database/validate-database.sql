-- Database Validation Script for CampusCruze
-- Run this script to validate the database schema and constraints

USE campus_ride_share;

-- Check if all required tables exist
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ENGINE,
    TABLE_COLLATION
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'campus_ride_share'
ORDER BY TABLE_NAME;

-- Validate users table structure
DESCRIBE users;

-- Validate rides table structure
DESCRIBE rides;

-- Validate ride_participants table structure
DESCRIBE ride_participants;

-- Validate messages table structure
DESCRIBE messages;

-- Check all foreign key constraints
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_SCHEMA = 'campus_ride_share'
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Check all indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    INDEX_TYPE,
    NON_UNIQUE,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'campus_ride_share'
ORDER BY TABLE_NAME, INDEX_NAME;

-- Validate default values and constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'campus_ride_share'
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Check if admin user exists
SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin';

-- Validate rides table defaults
SELECT 
    COUNT(*) as total_rides,
    COUNT(CASE WHEN max_seats = 6 THEN 1 END) as rides_with_6_seats,
    COUNT(CASE WHEN current_seats = 0 THEN 1 END) as rides_with_0_current_seats,
    COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_rides
FROM rides;

-- Check data integrity
SELECT 
    'Orphaned participants' as check_type,
    COUNT(*) as count
FROM ride_participants rp
LEFT JOIN rides r ON rp.ride_id = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 
    'Orphaned messages' as check_type,
    COUNT(*) as count
FROM messages m
LEFT JOIN rides r ON m.ride_id = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 
    'Invalid seat counts' as check_type,
    COUNT(*) as count
FROM rides 
WHERE current_seats > max_seats;

-- Show completion status
SELECT 
    'Database validation complete' as status,
    NOW() as timestamp;
