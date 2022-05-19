const express = require("express");
const Css = require("../models/Css");
const User = require("../models/User");
const verifyAdmin = require("./verifyAdmin");
const verifyToken = require("./verifyToken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

// Get all levels
router.get("/", async (req, res) => {
  try {
    const levels = await Css.find(
      req.query.level ? { level: req.query.level } : {}
    );
    res.json(req.query.level ? levels[0] || {} : levels);
  } catch (err) {
    res.json({ message: err });
  }
});

// Get single level by id
router.get("/:levelId", async (req, res) => {
  try {
    const level = await Css.findById(req.params.levelId);
    res.json(level);
  } catch (err) {
    res.json({ message: err });
  }
});

// Create level - if logged in - if admin
router.post(
  "/",
  upload.single("image"),
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const levels = await Css.find();

    const level = new Css({
      name: req.body.name,
      code: req.body.code,
      colors: JSON.parse(req.body.colors),
      level: levels.length + 1,
      solutionImage: {
        data: fs.readFileSync(path.join("uploads/" + req.file?.filename)),
        contentType: "image/png",
      },
    });

    try {
      const savedLevel = await level.save();
      res.json(savedLevel);
    } catch (err) {
      res.json({ message: err });
    }
  }
);

// Delete level - if logged in
router.delete("/:levelId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const removedLevel = await Css.deleteOne({ _id: req.params.levelId });
    res.json(removedLevel);
  } catch (err) {
    res.json({ message: err });
  }
});

// Update level - if logged in
router.patch("/:levelId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updatedLevel = await Css.updateOne(
      { _id: req.params.levelId },
      {
        $set: {
          name: req.body.name,
          code: req.body.code,
          colors: req.body.colors,
        },
      }
    );
    res.json(updatedLevel);
  } catch (err) {
    res.json({ message: err });
  }
});

// Submit level - if logged in
router.post("/:levelId/submit", verifyToken, async (req, res) => {
  try {
    const level = await Css.findById(req.params.levelId);

    if (level.code.replace(/\s/g, "") === req.body.code.replace(/\s/g, "")) {
      const user = await User.findById(req.user?._id);

      const playedGame = user.played.find(
        (game) => game.gameId === level._id.toString()
      );

      if (typeof playedGame !== undefined) {
        if (250 > playedGame.highestScore) playedGame.highestScore = 250;
      } else {
        user.played.push({
          gameId: level._id,
          highestScore: 250,
        });
      }

      user.progressCss =
        user.progressCss <= level.level ? level.level + 1 : user.progressCss;

      user.score = user.played.reduce(
        (partialSum, game) => partialSum + game.highestScore,
        0
      );

      // REPLACE 250 WITH SCORE SYSTEM

      await user.save();

      res.json({
        success: 1,
        message: "Level passed",
        data: {
          score: 250,
          highestScore: playedGame.highestScore,
        },
      });
    } else {
      res.json({ success: 0, message: "Wrong answer" });
    }
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
