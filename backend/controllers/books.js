const Book = require("../models/book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
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
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.modifyBook = (req, res, next) => {
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

      const oldImage = book.imageUrl.split("/images/")[1];

      if (req.file) {
        const fs = require("fs");
        fs.unlink(`backend/images/${oldImage}`, () => {});
      }

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

      const filename = book.imageUrl.split("/images/")[1];
      const fs = require("fs");
      fs.unlink(`backend/images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Livre supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
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

      const total = book.ratings.reduce((acc, cur) => acc + cur.grade, 0);
      book.averageRating = (total / book.ratings.length).toFixed(1);

      book
        .save()
        .then((updatedBook) => res.status(201).json(updatedBook))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(404).json({ error }));
};
