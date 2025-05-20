const express = require("express");
const router = express.Router();

const {
  getAllBooks,
  getOneBook,
  getBestRatedBooks,
  createBook,
  modifyBook,
  deleteBook,
  rateBook,
} = require("../controllers/books");

const auth = require("../middleware/auth");
const { upload, processImage } = require("../middleware/multer-config");

// 🔍 Obtenir les 3 livres les mieux notés
router.get("/bestrating", getBestRatedBooks);

// 📚 Obtenir tous les livres
router.get("/", getAllBooks);

// 📖 Obtenir un livre par ID
router.get("/:id", getOneBook);

// ➕ Ajouter un nouveau livre avec image
router.post("/", auth, upload, processImage, createBook);

// ✏️ Modifier un livre avec ou sans nouvelle image
router.put("/:id", auth, upload, processImage, modifyBook);

// ❌ Supprimer un livre
router.delete("/:id", auth, deleteBook);

// ⭐ Ajouter une note à un livre
router.post("/:id/rating", auth, rateBook);

module.exports = router;
