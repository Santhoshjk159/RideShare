# CampusCruze - Campus Ride Share Application 🚗

A modern, full-stack university campus ride-sharing platform built with React, Node.js, and MySQL. Designed for students to safely and efficiently share rides with fellow campus community members.

## 🚀 Features

### 🎯 Core Features

- **Smart Ride Matching** - Intelligent pairing based on destination and time windows
- **Real-time Chat** - Socket.IO powered group messaging for ride coordination  
- **JWT Authentication** - Secure login with access + refresh token system
- **Responsive Design** - Mobile-first UI with Tailwind CSS and custom branding
- **Admin Dashboard** - Complete analytics, user management, and ride monitoring
- **Professional UI/UX** - Modern design with Framer Motion animations

### 👥 User Features

- Secure registration and login with email validation
- Create ride requests with flexible time windows  
- Join compatible rides with automatic seat management
- Real-time group chat with other passengers
- Complete ride history and personal statistics
- Smart default tab selection based on user activity
- Mobile-optimized interface with responsive design

### 🛡️ Security & Performance

- Bcrypt password hashing with salt rounds
- HTTP-only secure cookies for refresh tokens
- CORS protection with configurable origins
- Rate limiting and Helmet security headers
- Input validation with Zod schemas
- Database foreign key constraints and indexes
- Production-ready error handling

## 🏗️ Tech Stack

### Frontend (React + TypeScript)
- **Vite + React 19** - Lightning-fast development with latest React features
- **TypeScript** - Full type safety and IntelliSense support
- **Tailwind CSS** - Custom design system with CampusCruze branding
- **Framer Motion** - Smooth animations and micro-interactions
- **React Router Dom** - Client-side routing with protected routes
- **React Hook Form + Zod** - Type-safe form validation
- **Socket.IO Client** - Real-time bidirectional communication
- **Axios** - HTTP client with request/response interceptors

### Backend (Node.js + Express)
- **Node.js + Express** - RESTful API with modular architecture
- **MySQL 8.0+** - Relational database with optimized schema
- **Socket.IO** - Real-time features and live chat
- **JWT** - Stateless authentication with refresh token rotation
- **Bcrypt** - Industry-standard password hashing
- **Helmet + CORS** - Production security middleware
- **Express Rate Limit** - API rate limiting protection

## 🗄️ Database Schema

```sql
-- Users with role-based access
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides with comprehensive tracking
CREATE TABLE rides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creator_id INT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    pickup_location VARCHAR(255),
    date DATE NOT NULL,
    time_window_start TIME NOT NULL,
    time_window_end TIME NOT NULL,
    max_seats INT NOT NULL DEFAULT 6,
    current_seats INT DEFAULT 0,
    status ENUM('waiting', 'active', 'full', 'completed', 'cancelled') DEFAULT 'waiting',
    notes TEXT,
    completed_by INT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Many-to-many ride participation
CREATE TABLE ride_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ride_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ride_user (ride_id, user_id)
);

-- Real-time messaging system
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ride_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Database Setup

```bash
# Create MySQL database (local development)
mysql -u root -p
CREATE DATABASE campus_ride_share;
exit

# Import production-ready schema
mysql -u root -p campus_ride_share < backend/database/complete-setup.sql
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
cp .env.example .env  # Update with backend URL
npm run dev  # Starts on http://localhost:5173
```

### 4. Environment Configuration

**Backend (.env):**
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campus_ride_share

# JWT Secrets (generate strong secrets for production)
JWT_SECRET=your-super-secure-jwt-secret-64-chars-minimum
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-64-chars-minimum
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🌐 FREE Production Deployment

Deploy your app **completely free** using GitHub + Railway:

### 🚂 **Railway All-in-One Deployment**
- **GitHub** - Free repository hosting
- **Railway** - Free frontend + backend + database hosting  
- **$5 free credits/month** - Covers 2-3 months of full usage
- **Single platform** - No need for multiple services

### 📋 **Quick Deployment Steps**

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/campuscruze.git
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [Railway.app](https://railway.app/)
   - Connect GitHub repository
   - Add MySQL database service
   - Deploy backend service (root: `backend`)
   - Deploy frontend service (root: `campus-ride-share`)

3. **Configure Environment Variables:**
   - Set database connection details
   - Add JWT secrets
   - Update service URLs

### 📚 **Detailed Deployment Guide**
See `RAILWAY-DEPLOYMENT.md` for complete step-by-step instructions.

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
- `POST /api/auth/register` - User registration with auto-login
- `POST /api/auth/login` - User login with JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Secure logout with token cleanup

### Rides Management
- `GET /api/rides` - Get rides with filtering (status, date, destination)
- `POST /api/rides` - Create new ride request
- `GET /api/rides/my-requests` - Get user's created rides
- `GET /api/rides/:id` - Get detailed ride information
- `POST /api/rides/:id/join` - Join a ride with validation
- `POST /api/rides/:id/complete` - Mark ride as completed
- `DELETE /api/rides/:id` - Delete ride (creator only)

### Admin Dashboard
- `GET /api/admin/stats` - Platform statistics and analytics
- `GET /api/admin/recent-rides` - Recent ride activity
- `GET /api/admin/recent-users` - Recent user registrations

### Real-time Chat
- `GET /api/rides/:id/messages` - Get chat message history
- `POST /api/rides/:id/messages` - Send message to ride group

## 🎨 Design System

### 🎯 **CampusCruze Branding**
- **Primary Colors**: Blue gradient (#3B82F6 to #6366F1)  
- **Secondary**: Purple accent (#8B5CF6)
- **Neutral**: Modern gray palette
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)

### 📱 **Responsive Design**
- **Mobile-first** approach with Tailwind CSS
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-friendly** interfaces with adequate spacing
- **Optimized** for both portrait and landscape orientations

### 🎭 **UI Components**
- **Cards**: Rounded corners with subtle shadows and hover effects
- **Buttons**: Gradient backgrounds with smooth transitions
- **Forms**: Floating labels with real-time validation
- **Navigation**: Clean tabs with active state indicators
- **Modals**: Backdrop blur with smooth animations

## 🔄 Real-time Features

### Socket.IO Events
- `connection` - User connects to socket server
- `joinRide` - Join specific ride chat room  
- `leaveRide` - Leave ride chat room
- `sendMessage` - Send message to ride participants
- `newMessage` - Receive new chat messages
- `rideUpdate` - Real-time ride status updates
- `userJoined` - Notification when user joins ride
- `userLeft` - Notification when user leaves ride

### Live Features
- **Real-time chat** in ride groups
- **Live participant updates** when users join/leave
- **Instant ride status changes** (active → full → completed)
- **Auto-refresh** dashboard every 5 minutes

## ✨ Key Features & Logic

### 🎯 **Smart Ride Management**
- **Fixed 6-seat configuration** for all rides
- **Creator participation logic**: Creator added as participant only when someone else joins
- **Status progression**: waiting → active → full → completed
- **Automatic seat counting** with visual progress indicators

### 🔐 **Authentication Flow** 
- **JWT access tokens** (15-minute expiry)
- **Refresh tokens** (7-day expiry, HTTP-only cookies)
- **Auto-login after registration** for seamless onboarding
- **Protected routes** with automatic token refresh

### 📊 **Dashboard Intelligence**
- **Smart default tabs**: Shows "My Rides" if user has active rides, otherwise "Create Ride"
- **Context-aware statistics** that change based on active tab
- **Real-time counts** for each section
- **Mobile-optimized** navigation with collapsible labels

## 🚀 Production Features

### 🛡️ **Security Hardening**
- **Password hashing** with bcrypt (12 salt rounds)
- **CORS configuration** for specific origins
- **Rate limiting** on API endpoints
- **Input sanitization** with Zod validation
- **SQL injection protection** with parameterized queries
- **XSS protection** with Helmet security headers

### ⚡ **Performance Optimizations**
- **Database indexing** on frequently queried columns
- **Connection pooling** for database efficiency  
- **Lazy loading** for images and components
- **Code splitting** with Vite bundling
- **CDN-ready** static assets

### 📈 **Monitoring & Analytics**
- **Error logging** for debugging
- **Performance monitoring** with Vercel Analytics
- **Database query optimization** with indexed searches
- **Real-time metrics** dashboard for admins

## 🤝 Contributing

We welcome contributions to CampusCruze! Here's how you can help:

### 🔄 **Development Workflow**
1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes with proper commit messages
5. **Test** thoroughly (frontend, backend, database)
6. **Submit** a pull request with detailed description

### 🧪 **Testing Guidelines**
- Test all user flows (registration, login, ride creation, joining)
- Verify responsive design on mobile and desktop
- Check real-time features (chat, notifications)
- Ensure admin dashboard functionality
- Test edge cases and error handling

### 📝 **Code Standards**
- Follow TypeScript best practices
- Use consistent naming conventions
- Add comments for complex logic
- Maintain component modularity
- Follow database normalization principles

## 📄 License

MIT License - Feel free to use this project for:
- ✅ Personal learning and development
- ✅ University projects and assignments  
- ✅ Commercial applications and startups
- ✅ Open source contributions
- ✅ Portfolio demonstrations

## 🎯 **Project Stats**

### 📊 **Codebase**
- **Frontend**: ~15 React components, fully TypeScript
- **Backend**: RESTful API with 20+ endpoints
- **Database**: 4 optimized tables with foreign key relationships
- **Real-time**: Socket.IO integration for live features

### 🏆 **Features Implemented**
- ✅ Complete user authentication system
- ✅ Advanced ride matching and management
- ✅ Real-time chat and notifications  
- ✅ Admin dashboard with analytics
- ✅ Mobile-responsive design
- ✅ Production-ready deployment setup

## 🌟 **What Makes CampusCruze Special**

### 🎓 **Built for Students**
- **University-focused** design and terminology
- **Safety-first** approach with verified users only
- **Cost-effective** ride sharing for budget-conscious students
- **Campus-optimized** with common destination patterns

### 💡 **Modern Tech Stack**
- **Latest React 19** with cutting-edge features
- **TypeScript** for enterprise-grade code quality
- **Real-time capabilities** with Socket.IO
- **Production-ready** security and performance optimizations

### � **Deployment Ready**
- **Zero-cost deployment** with detailed guides
- **Auto-deployment** via GitHub integration
- **Scalable architecture** ready for growth
- **Professional documentation** for easy onboarding

---

## 🎉 **Get Started Today!**

```bash
# Clone the repository
git clone https://github.com/yourusername/campuscruze-rideshare.git

# Set up backend
cd backend && npm install && npm run dev

# Set up frontend  
cd campus-ride-share && npm install && npm run dev

# Visit http://localhost:5173 and start sharing rides! 🚗
```

**Built with ❤️ for university students to share rides safely, efficiently, and affordably!**

### 🔗 **Quick Links**
- 📖 [Railway Deployment Guide](RAILWAY-DEPLOYMENT.md)
- ⚙️ [Railway Environment Setup](RAILWAY-ENV-SETUP.md)
- 🗄️ [Database Documentation](backend/database/)
- 🎨 [Component Library](campus-ride-share/src/components/)
- 🔧 [API Documentation](backend/routes/)

**Happy coding! 🎉**
