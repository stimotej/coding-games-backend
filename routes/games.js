const express = require("express");
const Game = require("../models/Game");
const verifyToken = require("./verifyToken");

const router = express.Router();

// Get all games
router.get("/", async (req, res) => {
  try {
    const games = await Game.find()
      .populate("createdBy")
      .populate("played.user");
    res.json(games);
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

// Create game - if logged in - if admin
router.post("/", verifyToken, async (req, res) => {
  const game = new Game({
    name: req.body.name,
    codeHtml: req.body.codeHtml,
    codeCss: req.body.codeCss,
    colors: req.body.colors,
    createdBy: req.user._id,
  });

  try {
    const savedGame = await game.save();

    res.json(savedGame);
  } catch (err) {
    res.json({ message: err });
  }
});

// Delete game - if logged in
router.delete("/:gameId", verifyToken, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (game.createdBy === req.user._id) {
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
router.patch("/:gameId", verifyToken, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (game.createdBy.toString() === req.user._id) {
      const updatedGame = await Game.updateOne(
        { _id: req.params.gameId },
        {
          $set: {
            name: req.body.name,
            codeHtml: req.body.codeHtml,
            codeCss: req.body.codeCss,
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
router.post("/:gameId/score", verifyToken, async (req, res) => {
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
router.post("/:gameId/review", verifyToken, async (req, res) => {
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

module.exports = router;
