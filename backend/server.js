const http = require("http");
const app = require("./app");

const normalizePort = (val) => parseInt(val, 10) || 3000;
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
