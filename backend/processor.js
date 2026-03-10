const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");

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
    // 1. Read the custom Telugu Font into Base64 (Only loads into memory once per execution)
    const fontPath = path.join(__dirname, "assets", "NotoSansTelugu-Regular.ttf");
    let fontBase64 = '';
    if (fs.existsSync(fontPath)) {
      const fontBuffer = fs.readFileSync(fontPath);
      fontBase64 = fontBuffer.toString('base64');
    }

    const htmlHeader = `
      <html>
        <head>
          <style>
            @font-face {
              font-family: 'NotoTelugu';
              src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
            }
            body {
              width: ${WIDTH}px;
              height: ${HEADER_HEIGHT}px;
              margin: 0;
              padding: 0;
              background-color: #fff8e6;
              font-family: 'NotoTelugu', sans-serif;
              border-bottom: 8px solid #c0392b;
              box-sizing: border-box;
              position: relative;
            }
            .title { text-align: center; color: #7a3e00; font-size: 38px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
            .subtitle { text-align: center; color: #7a3e00; font-size: 28px; font-weight: bold; margin: 0; }
            .subtext { text-align: center; color: #7a3e00; font-size: 22px; margin-top: 5px; margin-bottom: 15px; }
            
            .token-pill {
              background-color: #c0392b;
              color: white;
              font-size: 32px;
              font-weight: bold;
              text-align: center;
              padding: 5px 20px;
              border-radius: 8px;
              width: 260px;
              margin: 0 auto;
            }
            
            .footer-row {
              position: absolute;
              bottom: 15px;
              width: 100%;
              display: flex;
              justify-content: space-between;
              padding: 0 30px;
              box-sizing: border-box;
            }
            
            .meta-block { display: flex; flex-direction: column; }
            .meta-label { color: #555555; font-size: 16px; margin-bottom: -5px; }
            .meta-value { color: #000000; font-weight: bold; font-size: 20px; }
            .meta-value.large { font-size: 24px; }
            .right-align { align-items: flex-end; }
          </style>
        </head>
        <body>
          <div class="title">నారాయణ క్షేత్రం</div>
          <div class="subtitle">శ్రీ దేవుడు బాబు సంస్థానం</div>
          <div class="subtext">S. మూలపొలం</div>
          
          <div class="token-pill">టోకెన్ : ${tokenNumber}</div>
          
          <div class="footer-row">
            <div class="meta-block">
              <span class="meta-label">Date & Time</span>
              <span class="meta-value">${timestamp}</span>
            </div>
            <div class="meta-block right-align">
              <span class="meta-label">Category</span>
              <span class="meta-value large">${teluguGender}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    // Render HTML to an image buffer using headless Chrome (perfect text shaping)
    const headerImageBuffer = await nodeHtmlToImage({
      html: htmlHeader,
      transparent: false,
      puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    });

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
      { input: headerImageBuffer, top: 0, left: 0 },
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
