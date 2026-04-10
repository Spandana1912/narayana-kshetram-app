// ==========================
// Load environment variables FIRST
// ==========================
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { ManToken, WomanToken } = require('./models');
const processPhoto = require('./processor');
const supabase = require('./supabase');

const app = express();

// ==========================
// Middleware
// ==========================
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================
// MongoDB Connection
// ==========================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in .env file");
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ==========================
// GET all tokens
// ==========================
app.get('/api/tokens', async (req, res) => {
  try {
    const { gender } = req.query;
    let tokens = [];

    if (gender === 'Male') {
      tokens = await ManToken.find().sort({ createdAt: -1 });
      tokens = tokens.map(t => ({ ...t.toObject(), gender: 'Male' }));
    }
    else if (gender === 'Female') {
      tokens = await WomanToken.find().sort({ createdAt: -1 });
      tokens = tokens.map(t => ({ ...t.toObject(), gender: 'Female' }));
    }
    else {
      const men = await ManToken.find().sort({ createdAt: -1 });
      const women = await WomanToken.find().sort({ createdAt: -1 });

      tokens = [
        ...men.map(t => ({ ...t.toObject(), gender: 'Male' })),
        ...women.map(t => ({ ...t.toObject(), gender: 'Female' }))
      ].sort((a, b) => b.createdAt - a.createdAt);
    }

    const formatted = tokens.map(token => {
      const isUrl = token.photoPath && token.photoPath.startsWith('http');
      return {
        ...token,
        photoUrl: isUrl ? token.photoPath : `/uploads/${path.basename(token.photoPath)}`
      };
    });

    res.json(formatted);

  } catch (err) {
    console.error("❌ Fetch tokens error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// POST new token (NO DUPLICATES)
// ==========================
app.post('/api/tokens', async (req, res) => {
  try {
    const { image, tokenNumber, gender, category } = req.body;

    if (!image || !tokenNumber || !gender || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔒 Prevent duplicate token numbers PER GENDER
    const exists =
      gender === 'Male'
        ? await ManToken.findOne({ tokenNumber })
        : await WomanToken.findOne({ tokenNumber });

    if (exists) {
      return res.status(409).json({
        error: `Token number ${tokenNumber} already exists`
      });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const finalPath = await processPhoto(buffer, tokenNumber, gender, category);

    if (!finalPath) {
      return res.status(500).json({ error: "Image processing failed" });
    }

    const tokenData = {
      tokenNumber,
      category,
      photoPath: finalPath
    };

    const saved =
      gender === 'Male'
        ? await ManToken.create(tokenData)
        : await WomanToken.create(tokenData);

    const isUrl = finalPath.startsWith('http');

    res.json({
      _id: saved._id,
      tokenNumber,
      gender,
      category,
      photoUrl: isUrl ? finalPath : `/uploads/${path.basename(finalPath)}`
    });

  } catch (err) {
    console.error("❌ Save token error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// DELETE ALL TOKENS (DB + IMAGES)
// ==========================
app.delete('/api/tokens', async (req, res) => {
  try {
    const men = await ManToken.find({});
    const women = await WomanToken.find({});
    const allTokens = [...men, ...women];

    // 🧹 Delete images safely
    for (const token of allTokens) {
      if (token.photoPath) {
        const isUrl = token.photoPath.startsWith('http');
        if (isUrl && supabase && process.env.SUPABASE_BUCKET_NAME) {
          try {
            const urlParts = token.photoPath.split('/');
            const filename = urlParts[urlParts.length - 1];
            await supabase.storage.from(process.env.SUPABASE_BUCKET_NAME).remove([filename]);
          } catch (err) {
            console.error("Supabase delete error:", err);
          }
        } else {
          const absPath = path.isAbsolute(token.photoPath)
            ? token.photoPath
            : path.join(__dirname, token.photoPath);

          // SAFETY: only delete inside uploads folder
          if (
            absPath.includes(path.join(__dirname, 'uploads')) &&
            fs.existsSync(absPath)
          ) {
            fs.unlinkSync(absPath);
          }
        }
      }
    }

    // 🗑️ Delete DB records
    await ManToken.deleteMany({});
    await WomanToken.deleteMany({});

    res.json({ message: "All tokens and images deleted successfully" });

  } catch (err) {
    console.error("❌ Delete ALL error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// DELETE single token
// ==========================
app.delete('/api/tokens/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { gender } = req.query;

    let deleted = null;

    if (gender === 'Male') {
      deleted = await ManToken.findByIdAndDelete(id);
    }
    else if (gender === 'Female') {
      deleted = await WomanToken.findByIdAndDelete(id);
    }
    else {
      deleted =
        await ManToken.findByIdAndDelete(id) ||
        await WomanToken.findByIdAndDelete(id);
    }

    if (!deleted) {
      return res.status(404).json({ error: "Token not found" });
    }

    // 🧹 Remove image file
    if (deleted.photoPath) {
      const isUrl = deleted.photoPath.startsWith('http');
      if (isUrl && supabase && process.env.SUPABASE_BUCKET_NAME) {
        try {
          const urlParts = deleted.photoPath.split('/');
          const filename = urlParts[urlParts.length - 1];
          await supabase.storage.from(process.env.SUPABASE_BUCKET_NAME).remove([filename]);
        } catch (err) {
          console.error("Supabase delete error:", err);
        }
      } else {
        const absPath = path.isAbsolute(deleted.photoPath)
          ? deleted.photoPath
          : path.join(__dirname, deleted.photoPath);

        if (fs.existsSync(absPath)) {
          fs.unlinkSync(absPath);
        }
      }
    }

    res.json({ message: "Token deleted successfully" });

  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
