const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(800, 200);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, 800, 200);

ctx.fillStyle = '#000';
ctx.font = '30px "Nirmala UI", "Gautami", "Vani", sans-serif';
ctx.fillText('నారాయణ క్షేత్రం', 50, 50);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('test-font.png', buffer);
console.log('Test font image generated as test-font.png');
