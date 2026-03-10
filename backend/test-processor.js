require('dotenv').config();
const fs = require('fs');
const path = require('path');
const processPhoto = require('./processor');

async function runTest() {
  console.log("Testing processPhoto directly to catch the error...");
  try {
    // Read the logo to use as a dummy image buffer for testing
    const dummyImage = fs.readFileSync(path.join(__dirname, 'assets', 'finalLogo.png'));
    const result = await processPhoto(dummyImage, "108", "Male");
    console.log("Test Result:", result);
  } catch (err) {
    console.error("FATAL ERROR CAUGHT:", err);
  }
}

runTest();
