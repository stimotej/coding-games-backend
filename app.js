const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 5000;

// Gzip compression
app.use(compression());

// CORS
app.use(cors());

// Parse body to JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup Routes
const cssRoute = require("./routes/css");
const authRoute = require("./routes/auth");

// Middleware functions for routes
app.use("/api/games/css", cssRoute);
app.use("/api/auth", authRoute);

// Connect to MongoDB
mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MonogoDB");
  }
);

// Listen server on port
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
