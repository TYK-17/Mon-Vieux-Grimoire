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
  console.log("🖼️ [processImage] appelé");

  if (!req.file) {
    console.log("⚠️ Aucune image à traiter dans processImage.");
    console.log("🔚 processImage terminé ✅ (no file)");
    return next();
  }

  const imageBuffer = req.file.buffer;

  // Nettoyage nom fichier
  const safeName = req.file.originalname
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

  const ext = path.extname(safeName);
  const baseName = path.basename(safeName, ext);
  const fileName = `${Date.now()}_${baseName}.webp`;
  console.log(fileName);
  const imagesDir = path.join(__dirname, "../images");
  console.log(imagesDir);
  const filePath = path.join(imagesDir, fileName);
  console.log(filePath);

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log("📂 Dossier /images créé.");
  }

  try {
    console.log("🛠️ Traitement image avec Sharp...");
    const sharpInstance = sharp(imageBuffer);

    try {
      const metadata = await sharpInstance.metadata();
      console.log("📷 Metadata de l'image :", metadata);
    } catch (metaErr) {
      console.warn("⚠️ Impossible de lire les métadonnées :", metaErr.message);
    }

    console.log(filePath);
    try {
      await sharpInstance
        .resize(824, 1040, { fit: "contain" })
        .webp({ quality: 80, alphaQuality: 80 })
        .toFile(filePath);

      console.log("🟣 Après resize/toFile");
    } catch (resizeErr) {
      console.error("🔥 Erreur pendant resize/toFile:", resizeErr);
    }

    req.file.filename = fileName;
    console.log("✅ Image optimisée et enregistrée :", fileName);
  } catch (err) {
    console.error("❌ Erreur Sharp complète :", err);

    // Fallback brut en cas d'erreur
    const fallbackName = `${Date.now()}_${safeName}`;
    const fallbackPath = path.join(imagesDir, fallbackName);

    try {
      await fs.promises.writeFile(fallbackPath, imageBuffer);
      req.file.filename = fallbackName;
      console.log("✅ Image brute enregistrée :", fallbackName);
    } catch (writeErr) {
      console.error("❌ Erreur écriture fallback :", writeErr.message);
      console.log("🔚 processImage terminé ❌ (échec fallback)");
      return res
        .status(500)
        .json({ error: "Échec traitement + fallback image." });
    }
  }

  console.log("🔚 processImage terminé ✅ (avant next)");
  return next();
};

module.exports = { upload, processImage };
