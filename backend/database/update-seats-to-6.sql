-- Update existing rides to have max_seats = 6
UPDATE rides SET max_seats = 6 WHERE max_seats != 6;

-- Verify the update
SELECT id, destination, max_seats FROM rides;
