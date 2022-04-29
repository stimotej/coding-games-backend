const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Gzip compression
app.use(compression());

// Cors options
var whitelist = ["https://coding-games.vercel.app", "http://localhost:3000"];
var corsOptions = {
  optionsSuccessStatus: 200,
  // origin: function (origin, callback) {
  //   if (whitelist.indexOf(origin) !== -1) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error("Not allowed by CORS"));
  //   }
  // },
};
// CORS
app.use(cors(corsOptions));

// Parse body to JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup Routes
const cssRoute = require("./routes/css");
const gamesRoute = require("./routes/games");
const authRoute = require("./routes/auth");

// Middleware functions for routes
app.use("/api/css", cssRoute);
app.use("/api/games", gamesRoute);
app.use("/api/auth", authRoute);

// Connect to MongoDB
mongoose
  .connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database ");
  })
  .catch((err) => {
    console.error(`Error connecting to the database. \n${err}`);
  });

// Listen server on port
app.listen(port, () => {
  console.log(`Server is running...`);
});
