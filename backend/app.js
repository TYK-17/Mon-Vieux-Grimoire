const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");

dotenv.config();

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");

const app = express();

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connexion MongoDB réussie"))
  .catch((err) => console.error("Connexion MongoDB échouée :", err));

// Middleware JSON
app.use(express.json());
app.use(helmet()); // ✅ protection des en-têtes HTTP

// CORS global — remplace les setHeader manuels
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));

// Log des requêtes (placé avant les routes)
app.use((req, res, next) => {
  console.log(`Requête reçue depuis ${req.get("origin")} vers ${req.url}`);
  next();
});

// Fichiers statiques
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

module.exports = app;
