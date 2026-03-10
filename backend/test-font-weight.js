const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

registerFont(
  path.join(__dirname, "assets", "NotoSerifTelugu-Regular.ttf"),
  { family: "TeluguFont", weight: "normal" }
);

const canvas = createCanvas(800, 200);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, 800, 200);

ctx.fillStyle = '#000';
// Test WITHOUT bold
ctx.font = '30px TeluguFont';
ctx.fillText('నారాయణ క్షేత్రం - Regular', 50, 50);

// Test WITH bold
ctx.font = 'bold 30px TeluguFont';
ctx.fillText('నారాయణ క్షేత్రం - Bold', 50, 100);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('test-font-weight.png', buffer);
console.log('Test font image generated as test-font-weight.png');
