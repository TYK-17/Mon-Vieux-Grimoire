const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth");

router.post("/signup", authCtrl.signup); // Route pour l'inscription
router.post("/login", authCtrl.login); // Route pour la connexion

module.exports = router;
