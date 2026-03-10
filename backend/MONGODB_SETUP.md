# MongoDB Setup Guide

You have **two options** to set up MongoDB:

## Option 1: MongoDB Atlas (Cloud - Recommended) ⭐ EASIEST

MongoDB Atlas is free and doesn't require any installation on your computer.

### Steps:

1. **Sign up for MongoDB Atlas** (free):
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Create a free account

2. **Create a Cluster**:
   - After signing up, click "Build a Database"
   - Choose the **FREE** tier (M0)
   - Select a cloud provider and region (choose closest to you)
   - Click "Create"

3. **Create Database User**:
   - Go to "Database Access" in the left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Click "Add User"

4. **Whitelist Your IP**:
   - Go to "Network Access" in the left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your IP
   - Click "Confirm"

5. **Get Connection String**:
   - Go to "Database" in the left menu
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `templeDB`

6. **Create .env file** in the `backend` folder:
   ```
   MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/templeDB?retryWrites=true&w=majority
   ```

7. **Install dotenv package** (if not already installed):
   ```bash
   cd backend
   npm install
   ```

8. **Start your server**:
   ```bash
   node server.js
   ```

---

## Option 2: Install MongoDB Locally

### For Windows:

1. **Download MongoDB Community Server**:
   - Go to: https://www.mongodb.com/try/download/community
   - Select Windows, MSI package
   - Download and run the installer

2. **Install MongoDB**:
   - Run the installer
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. **Verify Installation**:
   - MongoDB should start automatically as a Windows service
   - You can check in Services (search "services" in Windows)

4. **Start MongoDB** (if not running):
   - Open Command Prompt or PowerShell as Administrator
   - Run: `net start MongoDB`
   - Or use MongoDB Compass to connect

5. **No .env file needed** - the server will use `mongodb://localhost:27017/templeDB` by default

6. **Start your server**:
   ```bash
   cd backend
   node server.js
   ```

---

## Quick Test

After setting up either option, start your server:
```bash
cd backend
node server.js
```

You should see: `✅ Connected to MongoDB`

If you see an error, check:
- MongoDB Atlas: Make sure your IP is whitelisted and connection string is correct
- Local MongoDB: Make sure the MongoDB service is running

