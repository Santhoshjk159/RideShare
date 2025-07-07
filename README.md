# Campus RideShare 🚗🎓

A full-stack ride-sharing platform built for university students to coordinate safe, smart, and efficient campus transportation.

## 🔑 Features

- 🔐 **JWT Auth** (Access + Refresh tokens)
- 💬 **Real-time Chat** (Socket.IO)
- 🧠 **Smart Ride Matching** (by destination/time)
- 📱 **Responsive UI** (TailwindCSS + Framer Motion)
- 📊 **Admin Dashboard** (with charts + analytics)
- 🛡️ **Secure Backend** (Zod, CORS, Bcrypt, Helmet)

## 🧑‍💻 Tech Stack

**Frontend**
- React + TypeScript + Vite
- TailwindCSS, Framer Motion
- React Router, Axios
- React Hook Form + Zod
- Recharts (Admin Analytics)

**Backend**
- Node.js + Express
- MySQL (Relational DB)
- Socket.IO (Live Chat)
- JWT + Bcrypt + Zod
- Helmet + CORS + Rate Limiting

## 🗂️ Database Schema Highlights

- `users` - Auth + role-based access (`student`, `admin`)
- `rides` - Time window + destination + status
- `ride_participants` - Join/leave ride logic
- `chat_messages` - Real-time ride-specific messaging

## 🚀 Local Setup

```bash
# 1. MySQL Setup
mysql -u root -p
CREATE DATABASE campus_rideshare;
# Import schema.sql

# 2. Backend
cd backend
cp .env.example .env   # Add MySQL & JWT configs
npm install && npm run dev

# 3. Frontend
cd campus-ride-share
npm install && npm run dev
