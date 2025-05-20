require("dotenv").config();
const http = require("http");
const app = require("./app");

const normalizePort = (val) => {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : port >= 0 ? port : false;
};

const port = normalizePort(process.env.SERVER_PORT || 4000);
app.set("port", port);

const server = http.createServer(app);

server.listen(port);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? `Pipe ${address}` : `Port ${port}`;
  console.log("✅ Serveur en écoute sur " + bind);
});

server.on("error", (error) => {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " nécessite des privilèges élevés.");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " est déjà utilisé.");
      process.exit(1);
    default:
      throw error;
  }
});

// Gestion globale des erreurs système
process.on("uncaughtException", (err) => {
  console.error("❌ Erreur non capturée :", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ Promesse non gérée :", reason);
});
