-- Add admin user to the database
-- Password: admin123

INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@campus.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/4gvjvTJfKz.YOKdBu', 'admin');

-- Note: The password hash is for 'password123' - you can change this after login
-- To generate a new hash for 'admin123', run this in your backend:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('admin123', 12);
-- console.log(hash);
