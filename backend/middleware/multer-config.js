const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// 🎯 Types MIME autorisés
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// 📦 Stockage en mémoire (pour Sharp)
const storage = multer.memoryStorage();

// 📥 Middleware réception de fichier
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (req, file, cb) => {
    console.log("📨 Fichier reçu :");
    console.log("  • Champ       :", file.fieldname);
    console.log("  • Nom         :", file.originalname);
    console.log("  • Type MIME   :", file.mimetype);

    const isValid = MIME_TYPES[file.mimetype];
    const error = isValid ? null : new Error("❌ Mauvais type de fichier !");
    if (!isValid) {
      console.error("⛔ Type MIME rejeté :", file.mimetype);
    }
    cb(error, isValid);
  },
}).single("image");

// 🖼️ Traitement de l'image avec Sharp
const processImage = async (req, res, next) => {
  if (!req.file) {
    console.log("⚠️ Aucune image à traiter dans processImage.");
    return next();
  }

  try {
    const imageBuffer = req.file.buffer;

    // Nettoyage nom fichier
    const safeName = req.file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();

    const fileName = `${Date.now()}_${safeName}.webp`;
    const imagesDir = path.join(__dirname, "../images");
    const filePath = path.join(imagesDir, fileName);

    // Dossier images
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
      console.log("📂 Dossier /images créé.");
    }

    console.log("🛠️ Traitement image avec Sharp...");
    await sharp(imageBuffer).resize(800).webp({ quality: 80 }).toFile(filePath);
    console.log("✅ Sharp a terminé sans erreur");

    req.file.filename = fileName;
    console.log("✅ Image optimisée et enregistrée :", fileName);
    console.log("📁 Emplacement :", filePath);
    console.log("📎 req.file.filename défini :", req.file.filename);

    next();
  } catch (err) {
    console.error("❌ Erreur traitement image avec Sharp :", err);
    return res
      .status(500)
      .json({ error: "Erreur lors du traitement de l'image." });
  }
};

module.exports = { upload, processImage };
