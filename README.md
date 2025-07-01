# Campus RideShare Application

A full-stack university campus ride-sharing system built with React + Node.js + MySQL.

## 🚀 Features

### 🎯 Core Features

- **JWT Authentication** with access + refresh tokens
- **Real-time Chat** via Socket.IO for ride coordination
- **Smart Ride Matching** based on destination and time
- **Responsive Design** with TailwindCSS
- **Admin Dashboard** with analytics and charts
- **Professional UI/UX** with Framer Motion animations

### 👥 User Features

- Secure sign-up/login with email validation
- Create ride requests with time windows
- Join existing rides that match your destination
- Real-time group chat with other riders
- View ride history and statistics
- Leave rides with automatic group management

### 🛡️ Security Features

- Bcrypt password hashing
- HTTP-only cookies for refresh tokens
- CORS protection
- Rate limiting
- Helmet security headers
- Input validation with Zod

## 🏗️ Tech Stack

### Frontend

- **Vite + React + TypeScript** - Fast development and type safety
- **TailwindCSS** - Professional styling with custom emerald theme
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **React Hook Form + Zod** - Form validation
- **Recharts** - Data visualization for admin dashboard
- **Axios** - HTTP client with interceptors

### Backend

- **Node.js + Express** - RESTful API server
- **MySQL** - Relational database with proper schemas
- **Socket.IO** - Real-time chat and notifications
- **JWT** - Secure authentication with refresh tokens
- **Bcrypt** - Password hashing
- **Zod** - Server-side validation
- **Helmet + CORS** - Security middleware

## 🗄️ Database Schema

```sql
-- Users table with roles
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides with time windows and status
CREATE TABLE rides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creator_id INT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    pickup_location VARCHAR(255),
    time_window_start TIME NOT NULL,
    time_window_end TIME NOT NULL,
    date DATE NOT NULL,
    max_seats INT DEFAULT 4,
    status ENUM('active', 'full', 'completed', 'cancelled') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ride participants for many-to-many relationship
CREATE TABLE ride_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ride_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_participant (ride_id, user_id)
);

-- Chat messages for real-time communication
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ride_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE campus_rideshare;
exit

# Import schema
mysql -u root -p campus_rideshare < backend/database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Update with your database credentials
npm run dev  # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd campus-ride-share
npm install
npm run dev  # Starts on http://localhost:5173
```

### 4. Environment Variables

**Backend (.env):**

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campus_rideshare

# JWT Secrets (generate strong secrets for production)
JWT_ACCESS_SECRET=your-super-secret-access-token
JWT_REFRESH_SECRET=your-super-secret-refresh-token
```

**Frontend (.env):**

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 📱 Application Flow

### User Journey

1. **Sign Up/Login** → Secure JWT authentication
2. **Dashboard** → View available rides, search/filter
3. **Create Ride** → Set destination, time window, max seats
4. **Join Ride** → Automatic matching based on destination/time
5. **Group Chat** → Real-time coordination with other riders
6. **Profile** → View ride history and statistics

### Admin Features

- **Analytics Dashboard** with charts and insights
- **User Management** capabilities
- **Ride Monitoring** and moderation tools

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Rides

- `GET /api/rides` - Get rides with filters
- `POST /api/rides` - Create new ride
- `GET /api/rides/:id` - Get ride details
- `POST /api/rides/:id/join` - Join a ride
- `POST /api/rides/:id/leave` - Leave a ride

### Users

- `GET /api/users/profile` - Get user profile
- `GET /api/users/stats` - Get user statistics

## 🎨 Design System

### Colors

- **Primary**: Emerald green (#10b981)
- **Secondary**: Soft grays and whites
- **Accents**: Success green, warning yellow, error red

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold, modern styling
- **Body**: Clean, readable text

### Components

- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Primary/secondary variants with hover states
- **Forms**: Validated inputs with icon indicators
- **Navigation**: Clean, intuitive layout

## 🔄 Real-time Features

### Socket.IO Events

- `joinRide` - User joins ride chat room
- `leaveRide` - User leaves ride chat room
- `sendMessage` - Send chat message to ride group
- `newMessage` - Receive new chat messages
- `userJoined` - Notification when user joins ride
- `userLeft` - Notification when user leaves ride

## 🚀 Deployment

### Production Setup

1. **Database**: Use PlanetScale, AWS RDS, or similar
2. **Backend**: Deploy to Railway, Render, or Heroku
3. **Frontend**: Deploy to Vercel, Netlify, or similar
4. **Environment**: Update all URLs and secrets for production

### Security Checklist

- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS in production
- [ ] Set secure cookie flags
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting
- [ ] Enable database SSL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

**Built with ❤️ for university students to share rides safely and efficiently!**
