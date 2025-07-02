# Railway Environment Variables Setup Guide

## 🗄️ **MySQL Database Service**
After creating MySQL database in Railway, note these values from Variables tab:

```
MYSQL_URL=mysql://root:password@host:port/database
MYSQL_HOST=containers-us-west-xxx.railway.app
MYSQL_PORT=6543
MYSQL_USER=root
MYSQL_PASSWORD=your-generated-password
MYSQL_DATABASE=railway
```

## 🔧 **Backend Service Variables**
Add these in Railway dashboard → Backend Service → Variables:

```
NODE_ENV=production
PORT=3000
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=railway
JWT_SECRET=generate-64-character-random-string
JWT_REFRESH_SECRET=generate-64-character-random-string
FRONTEND_URL=https://your-frontend-service.up.railway.app
```

## 🎨 **Frontend Service Variables**
Add these in Railway dashboard → Frontend Service → Variables:

```
VITE_API_URL=https://your-backend-service.up.railway.app/api
VITE_SOCKET_URL=https://your-backend-service.up.railway.app
```

## 🔗 **Service URLs**
After deployment, your Railway services will have URLs like:
- Backend: `https://backend-production-xxxx.up.railway.app`
- Frontend: `https://frontend-production-xxxx.up.railway.app`

Copy these exact URLs and update the environment variables accordingly.

## 📊 **Import Database Schema**
1. Go to your MySQL service in Railway dashboard
2. Click "Query" or use external MySQL client
3. Copy and paste content from `backend/database/complete-setup.sql`
4. Execute to create all tables and admin user

## 🎯 **JWT Secret Generation**
Generate secure random strings for JWT secrets:

```bash
# Use online generator or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use online tools like: https://generate-secret.vercel.app/64
