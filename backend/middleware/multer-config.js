// backend/middleware/multer-config.js

const multer = require("multer");
const sharp = require("sharp"); // Importer Sharp
const path = require("path");

// Définir les types MIME supportés
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Utilisation de memoryStorage pour garder l'image en mémoire
const storage = multer.memoryStorage();

// Configurer multer pour accepter les fichiers images
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limiter la taille à 5MB par fichier
  fileFilter: (req, file, cb) => {
    // Vérifier que le type MIME est valide
    const isValid = MIME_TYPES[file.mimetype];
    const error = isValid ? null : new Error("Mauvais type de fichier !");
    cb(error, isValid);
  },
}).single("image");

// Middleware pour traiter l'image après l'upload
const processImage = (req, res, next) => {
  if (!req.file) {
    console.log("Aucune image envoyée");
    return next(); // Si aucune image n'est envoyée, passer à la suite
  }

  console.log("Fichier reçu : ", req.file.originalname); // Log du nom de l'image
  const imageBuffer = req.file.buffer; // Récupérer le buffer de l'image

  // Utilisation de sharp pour optimiser et redimensionner l'image
  sharp(imageBuffer)
    .resize(800) // Redimensionner l'image à 800px de large
    .webp({ quality: 80 }) // Compresser l'image au format WebP avec une qualité de 80%
    .toFile(`backend/images/${req.file.filename}`, (err, info) => {
      if (err) {
        console.error("Erreur lors du traitement de l'image", err);
        return res
          .status(500)
          .json({ error: "Erreur lors du traitement de l'image" });
      }
      console.log("Image traitée et enregistrée", info);
      next(); // Passer à l'étape suivante (enregistrement du livre)
    });
};

module.exports = { upload, processImage };
