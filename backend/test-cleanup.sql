-- Test script to check ride cleanup functionality
-- Run this in your MySQL database to see the current state

-- Show all rides with their status and timing
SELECT 
    id,
    destination,
    date,
    time_window_start,
    time_window_end,
    status,
    creator_id,
    created_at,
    (SELECT COUNT(*) FROM ride_participants WHERE ride_id = rides.id) as participant_count
FROM rides 
ORDER BY date DESC, time_window_start DESC;

-- Show rides that should be expired (adjust the date/time as needed)
-- This helps you see which rides the cleanup should process
SELECT 
    id,
    destination,
    date,
    time_window_end,
    status,
    'EXPIRED' as should_be_cleaned,
    (SELECT COUNT(*) FROM ride_participants WHERE ride_id = rides.id) as participant_count
FROM rides 
WHERE status = 'active' 
AND (
    date < CURDATE() 
    OR (date = CURDATE() AND time_window_end < CURTIME())
);

-- Show completed rides
SELECT 
    id,
    destination,
    date,
    time_window_end,
    status,
    creator_id,
    (SELECT COUNT(*) FROM ride_participants WHERE ride_id = rides.id) as participant_count
FROM rides 
WHERE status = 'completed'
ORDER BY date DESC;
