const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');

console.log("Testing connection...");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas");
    process.exit(0);
  })
  .catch(err => {
    fs.writeFileSync('mongo-error.json', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    process.exit(1);
  });
