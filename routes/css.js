const express = require("express");
const Css = require("../models/Css");
const verifyAdmin = require("./verifyAdmin");
const verifyToken = require("./verifyToken");

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
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  const levels = await Css.find();

  const level = new Css({
    name: req.body.name,
    codeHtml: req.body.codeHtml,
    codeCss: req.body.codeCss,
    colors: req.body.colors,
    level: levels.length + 1,
  });

  try {
    const savedLevel = await level.save();
    res.json(savedLevel);
  } catch (err) {
    res.json({ message: err });
  }
});

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
          codeHtml: req.body.codeHtml,
          codeCss: req.body.codeCss,
          colors: req.body.colors,
        },
      }
    );
    res.json(updatedLevel);
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
