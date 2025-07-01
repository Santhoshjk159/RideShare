-- Check if ride 4 exists and its current state
SELECT 
  r.*,
  u.name as creator_name,
  (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as current_participants
FROM rides r
JOIN users u ON r.creator_id = u.id
WHERE r.id = 4;

-- Check participants for ride 4
SELECT 
  rp.*,
  u.name as participant_name,
  u.email as participant_email
FROM ride_participants rp
JOIN users u ON rp.user_id = u.id
WHERE rp.ride_id = 4;

-- Check all rides
SELECT 
  r.id,
  r.destination,
  r.status,
  r.current_seats,
  r.max_seats,
  u.name as creator_name
FROM rides r
JOIN users u ON r.creator_id = u.id
ORDER BY r.id;
