require("dotenv").config(); // Charger les variables d'environnement depuis le fichier .env

const http = require("http");
const app = require("./app"); // Assurez-vous que 'app' est bien configuré pour les routes, CORS, etc.
const cors = require("cors"); // Importer CORS

// Fonction pour définir et normaliser le port
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    console.log(
      `Port ${val} est invalide, utilisation de la valeur par défaut.`
    );
    return val; // Retourner le port tel quel si ce n'est pas un nombre
  }
  if (port >= 0) {
    console.log(`Port ${port} est valide.`);
    return port; // Si c'est un nombre valide, le retourner
  }
  return false; // Sinon, retourner faux (non valide)
};

// Récupérer le port depuis les variables d'environnement ou utiliser le port par défaut (4000 ici)
const port = normalizePort(process.env.PORT || 4000); // Si la variable d'environnement PORT n'est pas définie, on utilise le port 4000
app.set("port", port); // Définir le port sur l'application Express

// Configuration CORS
const corsOptions = {
  origin: "http://localhost:3001", // Autoriser le frontend à faire des requêtes au backend
  methods: "GET,POST,PUT,DELETE", // Méthodes HTTP autorisées
  allowedHeaders: "Content-Type,Authorization", // En-têtes autorisés
};

// Appliquer CORS à toutes les routes
app.use(cors(corsOptions));

// Ajoutons un log pour savoir si CORS est correctement appliqué
app.use((req, res, next) => {
  console.log(`Requête reçue depuis ${req.get("origin")} vers ${req.url}`);
  next();
});

// Créer le serveur HTTP
const server = http.createServer(app);

// Lancer le serveur sur le port configuré
server.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
  console.log(`CORS activé pour ${corsOptions.origin}`);
});
