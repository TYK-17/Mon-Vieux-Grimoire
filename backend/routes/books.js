const express = require("express");
const router = express.Router();
const bookCtrl = require("../controllers/books");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const { upload, processImage } = require("../middleware/multer-config");

// Route pour les 3 meilleurs livres
router.get("/bestrating", bookCtrl.getBestRatedBooks);

// Routes CRUD
router.get("/", bookCtrl.getAllBooks);
router.get("/:id", bookCtrl.getOneBook);

// Route pour créer un livre avec une image
// On utilise multer pour l'upload de l'image et processImage pour la traiter
router.post("/", auth, upload, processImage, bookCtrl.createBook);

router.put("/:id", auth, upload, processImage, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);

// Route pour noter un livre
router.post("/:id/rating", auth, bookCtrl.rateBook);

module.exports = router;
