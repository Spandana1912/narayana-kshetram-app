const sharp = require('sharp');
const fs = require('fs');

async function testSharpText() {
  const svg = `
  <svg width="800" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white"/>
    <text x="400" y="100" font-family="'Nirmala UI', 'Gautami', sans-serif" font-size="40" font-weight="bold" fill="black" text-anchor="middle">నారాయణ క్షేత్రం</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile('test-sharp.png');
    
  console.log("Sharp SVG test generated");
}

testSharpText();
