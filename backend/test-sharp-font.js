const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testSharpFont() {
  const fontPath = path.join(__dirname, 'assets', 'NotoSerifTelugu-Regular.ttf');
  const fontBase64 = fs.readFileSync(fontPath).toString('base64');

  const svg = `
  <svg width="800" height="200" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'TeluguFont';
        src: url(data:font/ttf;base64,${fontBase64});
      }
      text {
        font-family: 'TeluguFont', sans-serif;
      }
    </style>
    <rect width="100%" height="100%" fill="white"/>
    <text x="400" y="100" font-size="40" font-weight="bold" fill="black" text-anchor="middle">నారాయణ క్షేత్రం</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile('test-sharp-font.png');
    
  console.log("Sharp Base64 SVG test generated");
}

testSharpFont();
