const Book = require("../models/book");
const fs = require("fs");
const path = require("path");

// 📚 Créer un livre
exports.createBook = async (req, res) => {
  console.log("📥 createBook appelé");
  console.log("🧪 [createBook] req.file:", req.file);

  console.log("🧪 [createBook] req.body:", req.body);
  console.log("🧪 [createBook] typeof req.body.book:", typeof req.body.book);

  console.log("🧪 [createBook] req.body.book:", req.body.book);

  try {
    if (!req.file || !req.body.book) {
      return res.status(400).json({ message: "Image et données requises." });
    }

    const parsedBook = JSON.parse(req.body.book);
    console.log("🔍 parsedBook brut :", parsedBook);

    // Vérifications basiques
    const { title, author, genre, year, averageRating } = parsedBook;
    if (!title || !author || !genre || !year) {
      return res.status(400).json({ message: "Champs manquants." });
    }

    console.log("🟢 [createBook] req.auth:", req.auth);
    parsedBook.userId = req.auth.userId;
    parsedBook.year = Number(year);
    parsedBook.ratings = [
      {
        userId: req.auth.userId,
        grade: parseInt(averageRating, 10) || 0,
      },
    ];
    parsedBook.averageRating = parsedBook.ratings[0].grade;

    // Supprimer champs inutiles
    delete parsedBook._id;
    delete parsedBook._userId;

    // Vérifie que le nom de fichier existe
    if (!req.file.filename) {
      return res
        .status(500)
        .json({ message: "Image non traitée correctement." });
    }

    parsedBook.imageUrl = `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`;

    console.log("✅ Données finales à sauvegarder :", parsedBook);

    const book = new Book(parsedBook);
    const savedBook = await book.save();
    res.status(201).json(savedBook);
  } catch (err) {
    console.error("❌ Erreur createBook :", err.message, err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 📚 Lire tous les livres
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 📚 Lire un seul livre
exports.getOneBook = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: "Livre introuvable." });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ⭐ Meilleures notes
exports.getBestRatedBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✏️ Modifier un livre
exports.modifyBook = async (req, res) => {
  try {
    let updatedBook = req.file ? JSON.parse(req.body.book) : req.body;
    updatedBook.userId = req.auth.userId;
    updatedBook.year = Number(updatedBook.year);

    if (req.file) {
      updatedBook.imageUrl = `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`;
    }

    const existingBook = await Book.findOne({ _id: req.params.id });
    if (!existingBook)
      return res.status(404).json({ message: "Livre introuvable." });
    if (existingBook.userId !== req.auth.userId)
      return res.status(403).json({ message: "Non autorisé." });

    if (req.file) {
      const oldFilename = existingBook.imageUrl.split("/images/")[1];
      fs.unlink(path.join(__dirname, "../images", oldFilename), () => {});
    }

    await Book.updateOne({ _id: req.params.id }, updatedBook);
    res.status(200).json({ message: "Livre modifié !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🗑️ Supprimer un livre
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: "Livre introuvable." });
    if (book.userId !== req.auth.userId)
      return res.status(403).json({ message: "Non autorisé." });

    const filename = book.imageUrl.split("/images/")[1];
    fs.unlink(path.join(__dirname, "../images", filename), () => {});
    await Book.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: "Livre supprimé !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ⭐ Noter un livre
exports.rateBook = async (req, res) => {
  try {
    const rating = req.body.rating; // On ne prend PAS userId depuis le body !
    const userId = req.auth.userId; // On prend le userId sécurisé du token

    // Validation simple (optionnel : tu peux ajuster selon tes règles)
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Note invalide." });
    }

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: "Livre introuvable." });

    const hasRated = book.ratings.find((r) => r.userId === userId);
    if (hasRated) {
      return res.status(400).json({ message: "Livre déjà noté." });
    }

    // On ajoute la nouvelle note
    book.ratings.push({ userId, grade: rating });

    // Calcul de la nouvelle moyenne
    const sum = book.ratings.reduce((acc, r) => acc + r.grade, 0);
    book.averageRating = Math.round((sum / book.ratings.length) * 10) / 10;

    const updatedBook = await book.save();
    res.status(201).json(updatedBook);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};
