const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  console.log("🛡️ [auth] middleware appelé");
  try {
    const token = req.headers.authorization?.split(" ")[1]; // protège si pas de header
    console.log("🔑 [auth] token reçu :", token); // Ajoute ce log !
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: decodedToken.userId };
    next();
  } catch (error) {
    console.error("❌ [auth] erreur:", error); // Log l'erreur aussi !
    res.status(401).json({ error: "Requête non authentifiée !" });
  }
};
