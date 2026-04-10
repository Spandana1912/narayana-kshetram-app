const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const generatePng = (text, width, height, fontSize, fill, x, y, filename, weight = 'bold') => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.font = `${weight} ${fontSize}px "Nirmala UI", sans-serif`;
    ctx.fillStyle = fill;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'assets', filename), buffer);
    console.log(`Generated ${filename}`);
};

const generateRightPng = (text, width, height, fontSize, fill, filename) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${fontSize}px "Nirmala UI", sans-serif`;
    ctx.fillStyle = fill;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width - 5, height / 2 + 5);
    
    fs.writeFileSync(path.join(__dirname, 'assets', filename), canvas.toBuffer('image/png'));
    console.log(`Generated ${filename}`);
};

const generateRightAlignCenterPng = (text, width, height, fontSize, fill, filename) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${fontSize}px "Nirmala UI", sans-serif`;
    ctx.fillStyle = fill;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width, height / 2 + 5);
    
    fs.writeFileSync(path.join(__dirname, 'assets', filename), canvas.toBuffer('image/png'));
    console.log(`Generated ${filename}`);
};

// Canvas: 800w for center-aligned texts so they match exactly the Sharp overlay at 0,0
generatePng("నారాయణ క్షేత్రం", 800, 70, 38, "#7a3e00", 400, 35, "title.png");
generatePng("శ్రీ దేవుడు బాబు సంస్థానం", 800, 50, 28, "#7a3e00", 400, 25, "subtitle.png");
generatePng("S. మూలపొలం", 800, 40, 22, "#7a3e00", 400, 20, "location.png", "normal");

// Token Prefix: "టోకెన్ : " (white) right aligned against the center
generateRightAlignCenterPng("టోకెన్ : ", 390, 50, 32, "#ffffff", "token_prefix.png");

// Category Right-aligned texts: width 350
generateRightPng("పురుషుడు", 350, 40, 24, "#000000", "cat_m.png");
generateRightPng("స్త్రీ", 350, 40, 24, "#000000", "cat_f.png");
generateRightPng("పురుషుడు (ఇతరులు)", 350, 40, 24, "#000000", "cat_mo.png");
generateRightPng("స్త్రీ (ఇతరులు)", 350, 40, 24, "#000000", "cat_fo.png");
