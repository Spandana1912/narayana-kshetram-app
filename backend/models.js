const mongoose = require('mongoose');

// 1. The Blueprint: This defines what every record looks like
const TokenSchema = new mongoose.Schema({
    tokenNumber: {
        type: Number,
        required: true
    },
    category: {
        type: String, // "Self" or "Others"
        required: true
    },
    photoPath: {
        type: String, // Stores the location of the watermarked photo on your laptop
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically records when the photo was taken
    }
});

// 2. The Separate Backend Logic:
// We use the same blueprint to create two distinct "collections" (tables).
// This physically separates the data in the database.
const ManToken = mongoose.model('ManToken', TokenSchema);
const WomanToken = mongoose.model('WomanToken', TokenSchema);

// 3. Export them so server.js can use them
module.exports = { ManToken, WomanToken };