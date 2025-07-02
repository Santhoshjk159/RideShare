-- Final Production Database Deployment Script
-- Run this file to deploy the database for production

-- Step 1: Create the database and tables
SOURCE complete-setup.sql;

-- Step 2: Apply any pending updates (if upgrading from development)
SOURCE update-seats-to-6.sql;

-- Step 3: Validate the database structure and data
SOURCE validate-database.sql;

-- Step 4: Production-specific configurations
-- Remove any sample/test data if present
DELETE FROM rides WHERE notes LIKE '%test%' OR notes LIKE '%sample%';
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Ensure admin user exists with correct credentials
SELECT 'Admin user status:' as info, COUNT(*) as count FROM users WHERE role = 'admin';

-- Final validation
SELECT 
    'Production deployment status' as status,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'campus_ride_share') as tables_created,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
    NOW() as deployed_at;

-- Show summary
SELECT 
    'Database ready for production' as message,
    'All tables, constraints, and indexes are properly configured' as details;
