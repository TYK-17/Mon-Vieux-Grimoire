const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");

const app = express();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connexion MongoDB réussie"))
  .catch((err) => console.error("Connexion MongoDB échouée :", err));

app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ou http://localhost:5173 si tu veux restreindre
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

module.exports = app;
