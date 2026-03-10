# Quick Start Guide

## Step 1: Check MongoDB Connection

When you run `node server.js`, you should see:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

If you see an error instead, you need to set up MongoDB first.

## Step 2: Set Up MongoDB (Choose One)

### Option A: MongoDB Atlas (Cloud - Easiest) ⭐

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free account → Create free cluster (M0)
3. Create database user (save username/password)
4. Network Access → Add IP Address → Allow from anywhere
5. Database → Connect → Connect your application
6. Copy connection string
7. Create `backend/.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/templeDB?retryWrites=true&w=majority
   ```
8. Replace `username` and `password` with your actual credentials

### Option B: Install MongoDB Locally

1. Download: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server for Windows
3. MongoDB will run as a Windows service automatically
4. No .env file needed (uses localhost by default)

## Step 3: Start Backend

```bash
cd backend
node server.js
```

You should see: `✅ Connected to MongoDB`

## Step 4: Start Frontend (in a new terminal)

```bash
cd frontend
npm start
```

The app will open at: http://localhost:3000

## Step 5: Use the App

1. Allow webcam access when prompted
2. Click "📸 Capture Photo"
3. Select Gender (Male/Female)
4. Select Category (Self/Others)
5. Enter/confirm Token Number
6. Click "💾 Save Token"

The photo will be watermarked with:
- Temple logo (top-right)
- Token number (bottom-left)
- Timestamp (bottom-left)

And saved to MongoDB in the appropriate collection!

