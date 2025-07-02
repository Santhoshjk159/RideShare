-- THIS FILE IS DEPRECATED AND MARKED FOR DELETION
-- Use complete-setup.sql instead for production deployment
-- This file contains outdated schema and sample data

-- DEPRECATED: Old schema with incorrect defaults
-- - Used max_seats DEFAULT 4 (should be 6)
-- - Used current_seats DEFAULT 1 (should be 0)
-- - Used role ENUM('student', 'admin') (should be 'user', 'admin')
-- - Used status ENUM missing 'waiting' state
-- - Missing completion tracking fields
-- - Wrong database name (campus_rideshare vs campus_ride_share)

-- DELETE THIS FILE BEFORE PRODUCTION DEPLOYMENT
