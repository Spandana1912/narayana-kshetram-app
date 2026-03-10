const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const processPhoto = async (imageBuffer, tokenNumber, gender, category = 'Self') => {
  try {
    console.log("📸 processPhoto CALLED");

    const uploadsDir = path.join(__dirname, "uploads");
    const logoPath = path.join(__dirname, "assets", "finalLogo.png");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const outputPath = path.join(
      uploadsDir,
      `${gender}_${tokenNumber}_${Date.now()}.jpg`
    );

    /* ================= DIMENSIONS ================= */
    const WIDTH = 800;
    const HEADER_HEIGHT = 280;
    const IMAGE_HEIGHT = 720;
    const TOTAL_HEIGHT = HEADER_HEIGHT + IMAGE_HEIGHT;

    // Load Logo for compositing
    let logoBuffer = null;
    if (fs.existsSync(logoPath)) {
      logoBuffer = await sharp(logoPath).resize(120, 120, { fit: 'contain' }).toBuffer();
    }

    /* ================= HEADER SVG (FOR PERFECT TEXT SHAPING) ================= */
    const timestamp = new Date().toLocaleString("en-IN", { hour12: true });
    
    // Format Gender text
    let teluguGender = gender.toLowerCase() === "male" ? "పురుషుడు" : "స్త్రీ";
    
    // Append (ఇతరులు) if category is Others
    if (category.toLowerCase() === 'others') {
      teluguGender += " (ఇతరులు)";
    }
    
    // Using native Windows fonts that support Telugu (Nirmala UI, Gautami, Vani)
    const svgHeader = `
    <svg width="${WIDTH}" height="${HEADER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${WIDTH}" height="${HEADER_HEIGHT}" fill="#fff8e6"/>
      <rect x="0" y="${HEADER_HEIGHT - 8}" width="${WIDTH}" height="8" fill="#c0392b"/>
      
      <g font-family="'Nirmala UI', Gautami, sans-serif" text-anchor="middle">
        <text x="${WIDTH / 2}" y="50" font-size="38" font-weight="bold" fill="#7a3e00">నారాయణ క్షేత్రం</text>
        <text x="${WIDTH / 2}" y="95" font-size="28" font-weight="bold" fill="#7a3e00">శ్రీ దేవుడు బాబు సంస్థానం</text>
        <text x="${WIDTH / 2}" y="130" font-size="22" fill="#7a3e00">S. మూలపొలం</text>
        
        <!-- Highlighted Token -->
        <rect x="${WIDTH / 2 - 130}" y="150" width="260" height="50" fill="#c0392b" rx="8"/>
        <text x="${WIDTH / 2}" y="185" font-size="32" font-weight="bold" fill="#ffffff">టోకెన్ : ${tokenNumber}</text>
      </g>
      
      <g font-family="'Nirmala UI', sans-serif">
        <text x="30" y="220" font-size="16" fill="#555555">Date &amp; Time</text>
        <text x="30" y="245" font-size="20" font-weight="bold" fill="#000000">${timestamp}</text>
        
        <text x="${WIDTH - 30}" y="220" font-size="16" fill="#555555" text-anchor="end">Category</text>
        <text x="${WIDTH - 30}" y="245" font-size="24" font-weight="bold" fill="#000000" text-anchor="end">${teluguGender}</text>
      </g>
    </svg>`;

    const headerSvgBuffer = Buffer.from(svgHeader);

    /* ================= FACE IMAGE ================= */
    const faceImage = await sharp(imageBuffer)
      .resize(WIDTH, IMAGE_HEIGHT, {
        fit: "cover",
        position: "center",
        background: { r: 255, g: 255, b: 255 }
      })
      .toBuffer();

    /* ================= FINAL COMPOSE ================= */
    // Build array of overlays
    const overlays = [
      { input: headerSvgBuffer, top: 0, left: 0 },
      { input: faceImage, top: HEADER_HEIGHT, left: 0 }
    ];

    // Overlay logo if it exists
    if (logoBuffer) {
      overlays.push({ input: logoBuffer, top: 20, left: 40 });
    }

    await sharp({
      create: {
        width: WIDTH,
        height: TOTAL_HEIGHT,
        channels: 3,
        background: { r: 255, g: 248, b: 230 }
      }
    })
      .composite(overlays)
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    console.log("✅ IMAGE CREATED SUCCESSFULLY");

    let finalImageUrl = outputPath;

    // Optional Supabase Upload
    const supabase = require("./supabase");
    if (supabase && process.env.SUPABASE_BUCKET_NAME) {
      try {
        const fileBuffer = fs.readFileSync(outputPath);
        const fileName = path.basename(outputPath);

        const { data, error } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET_NAME)
          .upload(fileName, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from(process.env.SUPABASE_BUCKET_NAME)
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
        console.log("☁️ Uploaded to Supabase:", finalImageUrl);

        // Remove local file after successful upload
        fs.unlinkSync(outputPath);
      } catch (uploadErr) {
        console.error("❌ Supabase upload failed, falling back to local:", uploadErr);
      }
    }

    return finalImageUrl;

  } catch (err) {
    console.error("❌ Image processing failed:", err);
    return null;
  }
};

module.exports = processPhoto;
