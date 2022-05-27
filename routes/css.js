const express = require("express");
const Css = require("../models/Css");
const User = require("../models/User");
const verifyAdmin = require("./verifyAdmin");
const verifyToken = require("./verifyToken");
const { upload } = require("../s3");
const fs = require("fs");

const router = express.Router();

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

    console.log("File: ", req.file);

    const level = new Css({
      name: req.body.name,
      code: req.body.code,
      colors: JSON.parse(req.body.colors),
      level: levels.length + 1,
      solutionImage: req.file.location,
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

const Jimp = require("jimp");
var multer = require("multer");
var uploadd = multer();

// Submit level - if logged in
router.post(
  "/:levelId/submit",
  uploadd.single("image"),
  verifyToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user?._id);
      const level = await Css.findById(req.params.levelId);

      const solutionImage = await Jimp.read(level.solutionImage);
      const submitedImage = await Jimp.read(req.file.buffer);

      const imageDifference = Jimp.diff(submitedImage, solutionImage).percent;
      const codeLength = req.body.code.length;
      const totalScore = Number(
        (codeLength / (imageDifference <= 0 ? 0.01 : imageDifference)).toFixed(
          2
        )
      );

      var highestScore = totalScore;

      const playedGame = user.played.find(
        (game) => game.gameId === level._id.toString()
      );

      if (typeof playedGame !== "undefined") {
        if (totalScore > playedGame.highestScore)
          playedGame.highestScore = totalScore;
        else highestScore = playedGame.highestScore;
      } else {
        console.log("ff");
        user.played.push({
          gameId: level._id,
          highestScore: totalScore,
        });
      }

      user.progressCss =
        user.progressCss <= level.level ? level.level + 1 : user.progressCss;

      user.score = user.played.reduce(
        (partialSum, game) => partialSum + game.highestScore,
        0
      );

      await user.save();

      res.json({
        success: 1,
        message: "Level passed",
        data: {
          score: totalScore,
          codeLength,
          imageDifference,
          highestScore,
        },
        user,
      });
    } catch (err) {
      res.json({ message: err });
    }
  }
);

module.exports = router;
