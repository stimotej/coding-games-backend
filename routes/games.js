const express = require("express");
const Game = require("../models/Game");
const User = require("../models/User");
const verifyToken = require("./verifyToken");
const { upload } = require("../s3");

const router = express.Router();

// Get all games
router.get("/", async (req, res) => {
  try {
    const games = await Game.find(
      req.query.createdBy ? { createdBy: req.query.createdBy } : {}
    )
      .populate("createdBy")
      .populate("played.user");
    res.json(games);
  } catch (err) {
    res.json({ message: err });
  }
});

// Get all games created by logged in user
router.get("/my-games", verifyToken(), async (req, res) => {
  try {
    const games = await Game.find({ createdBy: req.user._id })
      .populate("createdBy")
      .populate("played.user");
    res.json(games);
  } catch (err) {
    res.json({ message: err });
  }
});

// Get all games
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find({}).sort({ score: "desc" }).limit(5);
    res.json(
      users.map((user) => ({
        _id: user._id,
        score: user.score,
        username: user.username,
        name: user.name,
        image: user.image,
      }))
    );
  } catch (err) {
    res.json({ message: err });
  }
});

// Get single game by id
router.get("/:gameId", async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
      .populate("createdBy")
      .populate("played.user");
    res.json(game);
  } catch (err) {
    res.json({ message: err });
  }
});

// Create game - if logged in
router.post("/", upload.single("image"), verifyToken(), async (req, res) => {
  console.log("File: ", req.file);
  const game = new Game({
    name: req.body.name,
    code: req.body.code,
    colors: JSON.parse(req.body.colors),
    createdBy: req.user._id,
    solutionImage: req.file.location,
  });

  try {
    const savedGame = await game.save();

    res.json(savedGame);
  } catch (err) {
    res.json({ message: err });
  }
});

// Delete game - if logged in
router.delete("/:gameId", verifyToken(), async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (game.createdBy.toString() === req.user._id) {
      const removedGame = await Game.deleteOne({ _id: req.params.gameId });
      res.json(removedGame);
    } else {
      res.status(400).json({ message: "You can delete only your games." });
    }
  } catch (err) {
    res.json({ message: err });
  }
});

// Update game - if logged in
router.patch("/:gameId", verifyToken(), async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (game.createdBy.toString() === req.user._id) {
      const updatedGame = await Game.updateOne(
        { _id: req.params.gameId },
        {
          $set: {
            name: req.body.name,
            code: req.body.code,
            colors: req.body.colors,
          },
        }
      );
      res.json(updatedGame);
    } else {
      res.status(400).json({ message: "You can edit only your games." });
    }
  } catch (err) {
    res.json({ message: err });
  }
});

// Add user and score when played - if logged in
router.post("/:gameId/score", verifyToken(), async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
      .populate("createdBy")
      .populate("played.user");
    game.played.push({
      user: req.user._id,
      score: req.body.score,
    });
    const savedGame = await game.save();
    // Game.find({}).populate("played.user");

    res.json(savedGame);
  } catch (err) {
    res.json({ message: err });
  }
});

// Add review - if logged in
router.post("/:gameId/review", verifyToken(), async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
      .populate("createdBy")
      .populate("played.user");
    game.reviews.push(req.body.review);
    const savedGame = await game.save();

    res.json(savedGame);
  } catch (err) {
    res.json({ message: err });
  }
});

const Jimp = require("jimp");
var multer = require("multer");
var uploadd = multer();

router.post(
  "/:gameId/submit",
  uploadd.single("image"),
  verifyToken(true),
  async (req, res) => {
    try {
      const game = await Game.findById(req.params.gameId);

      const solutionImage = await Jimp.read(game.solutionImage);
      const submitedImage = await Jimp.read(req.file.buffer);

      const imageDifference = Jimp.diff(submitedImage, solutionImage).percent;
      const codeLength = req.body.code.length;
      const totalScore = Number(
        (codeLength / (imageDifference <= 0 ? 0.01 : imageDifference)).toFixed(
          2
        )
      );

      if (req.user) {
        const user = await User.findById(req.user?._id);

        var highestScore = totalScore;

        const playedGame = user.played.find(
          (item) => item.game.toString() === game._id.toString()
        );

        if (typeof playedGame !== "undefined") {
          if (totalScore > playedGame.highestScore)
            playedGame.highestScore = totalScore;
          else highestScore = playedGame.highestScore;
        } else {
          user.played.push({
            game: game._id,
            highestScore: totalScore,
            isLevel: false,
          });
        }

        user.score = user.played.reduce(
          (partialSum, game) => partialSum + game.highestScore,
          0
        );

        await user.save();

        res.json({
          success: 1,
          message: "Game finished",
          data: {
            score: totalScore,
            codeLength,
            imageDifference,
            highestScore,
          },
          user,
        });
      } else {
        res.json({
          success: 1,
          message: "Game finished",
          data: {
            score: totalScore,
            codeLength,
            imageDifference,
          },
        });
      }
    } catch (err) {
      res.json({ message: err });
    }
  }
);

module.exports = router;
