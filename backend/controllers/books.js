const Book = require("../models/book");
const fs = require("fs");
const path = require("path");

exports.createBook = (req, res, next) => {
  // Vérification si une image a été envoyée
  if (!req.file) {
    return res.status(400).json({ message: "L'image est requise." });
  }

  const bookObject = JSON.parse(req.body.book); // Extraction des informations du livre
  delete bookObject._id;
  delete bookObject._userId;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId, // Identifiant de l'utilisateur connecté
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`, // Lien vers l'image
    ratings: [],
    averageRating: 0,
  });

  book
    .save()
    .then(() => res.status(201).json({ message: "Livre enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      res.status(200).json(book);
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  // Si une image a été envoyée, modifier l'image
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Requête non autorisée !" });
      }

      // Si l'image a été modifiée, supprimer l'ancienne image
      if (req.file) {
        const oldImage = book.imageUrl.split("/images/")[1];
        fs.unlink(path.join(__dirname, "../images", oldImage), (err) => {
          if (err) {
            console.error(
              "Erreur lors de la suppression de l'ancienne image",
              err
            );
          } else {
            console.log("Ancienne image supprimée");
          }
        });
      }

      // Mise à jour du livre
      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }
      )
        .then(() => res.status(200).json({ message: "Livre modifié !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(404).json({ error }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Requête non autorisée !" });
      }

      // Suppression de l'image associée
      const filename = book.imageUrl.split("/images/")[1];
      fs.unlink(path.join(__dirname, "../images", filename), (err) => {
        if (err) {
          console.error("Erreur lors de la suppression de l'image", err);
        } else {
          console.log("Image supprimée avec succès");
        }
      });

      // Suppression du livre de la base de données
      Book.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: "Livre supprimé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(404).json({ error }));
};

exports.rateBook = (req, res, next) => {
  const { userId, rating } = req.body;

  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: "Note invalide." });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      const alreadyRated = book.ratings.find((r) => r.userId === userId);
      if (alreadyRated) {
        return res
          .status(400)
          .json({ message: "Livre déjà noté par cet utilisateur." });
      }

      book.ratings.push({ userId, grade: rating });

      // Calcul de la note moyenne
      const total = book.ratings.reduce((acc, cur) => acc + cur.grade, 0);
      book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

      // Sauvegarde du livre avec la nouvelle note
      book
        .save()
        .then((updatedBook) => res.status(201).json(updatedBook))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(404).json({ error }));
};
