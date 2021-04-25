require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
app.use(
  cors({
    exposedHeaders: ["Content-Length", "x-token-access", "x-token-refresh"],
  })
);
const bearerToken = require("express-bearer-token");
app.use(bearerToken());
const PORT = 5000;
const morgan = require("morgan");
morgan.token("date", function (req, res) {
  return new Date();
});

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`<h1>Selamat datang di API</h1>`);
});

const { AuthRoutes } = require("./src/routes");
app.use("/auth", AuthRoutes);

app.all("*", (req, res) => {
  res.status(400).send("resource not found");
});

app.listen(PORT, () => console.log("listen in port" + PORT));
