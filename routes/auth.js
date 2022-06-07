const router = require("express").Router();
const User = require("../models/User");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const {
  registerValidation,
  loginValidation,
  passwordValidation,
} = require("../validation");
const verifyToken = require("./verifyToken");
const { upload } = require("../s3");

// Get list of users - if logged in
router.get("/", verifyToken(), async (req, res) => {
  try {
    const users = await User.find(
      req.query.role ? { role: req.query.role } : {}
    );
    res.json(users);
  } catch (err) {
    res.json({ message: err });
  }
});

// Get logged in user
router.get("/profile", verifyToken(), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("played.game");
    res.json(user);
  } catch (err) {
    res.json({ message: err });
  }
});

// Get users best played games
router.get("/profile/best-played", verifyToken(), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("played.game");
    const bestPlayed = user.played
      .sort((a, b) => b.highestScore - a.highestScore) // Sort "desc" by highestScore
      .slice(0, 8); // Limit return to 8 played games
    res.json(bestPlayed);
  } catch (err) {
    res.json({ message: err });
  }
});

// Delete logged in user
router.delete("/profile", verifyToken(), async (req, res) => {
  try {
    const removedUser = await User.deleteOne({ _id: req.user._id });
    res.json(removedUser);
  } catch (err) {
    res.json({ message: err });
  }
});

// Update logged in user
router.patch(
  "/profile",
  upload.single("image"),
  verifyToken(),
  async (req, res) => {
    var newUserData = {};

    if (req.body.username) newUserData.username = req.body.username;
    if (req.body.name) newUserData.name = req.body.name;
    if (req.body.email) {
      const emailExist = await User.findOne({ email: req.body.email });
      console.log(typeof req.user._id);
      if (emailExist && emailExist._id.toString() !== req.user._id)
        return res.status(400).send({ message: "Email already exists" });
      else newUserData.email = req.body.email;
    }
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      newUserData.password = hashedPassword;
    }
    if (req.file) {
      newUserData.image = req.file.location;
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        { _id: req.user._id },
        {
          $set: newUserData,
        },
        { new: true }
      );
      res.json(updatedUser);
    } catch (err) {
      res.json(err);
    }
  }
);

router.patch("/password", verifyToken(), async (req, res) => {
  const { error } = passwordValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(req.user._id);

  const validCurrentPassword = await bcrypt.compare(
    req.body.currentPassword,
    user.password
  );
  if (!validCurrentPassword)
    return res.status(400).send({ message: "Wrong current password" });

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(req.body.newPassword, salt);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          password: hashedNewPassword,
        },
      },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.json(err);
  }
});

// Get single user by id - if logged in
router.get("/:userId", verifyToken(), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json(user);
  } catch (err) {
    res.json({ message: err });
  }
});

// REGISTER NEW USER - if logged in
router.post("/register", async (req, res) => {
  // Validate register data
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Check if email is already in database
  // const emailExist = await User.findOne({ email: req.body.email });
  // if (emailExist) return res.status(400).send("Email already exists");

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // Create user
  const user = new User({
    username: req.body.username,
    password: hashedPassword,
  });

  // Save user to MongoDB
  try {
    const savedUser = await user.save();

    const token = jwt.sign({ _id: savedUser._id }, process.env.TOKEN_SECRET);
    res.header("auth-token", token).send(token);
  } catch (err) {
    res.json({ message: err });
  }
});

// LOGIN USER
router.post("/login", async (req, res) => {
  // Validate login data
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Find user by username
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send("Username or password is wrong");

  // Check password on that user
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send("Username or password is wrong");

  // Create and send token
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
  res.header("auth-token", token).send(token);
});

// UPDATE USER - if logged in
router.patch("/:userId", verifyToken(), async (req, res) => {
  // Validate register data
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Check if email is already in database
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist && emailExist._id != req.params.userId)
    return res.status(400).send("Email already exists");

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  try {
    const updatedUser = await User.updateOne(
      { _id: req.params.userId },
      {
        $set: {
          username: req.body.username,
          password: hashedPassword,
          name: req.body.name,
          email: req.body.email,
        },
      }
    );
    res.json(updatedUser);
  } catch (err) {
    res.json({ message: err });
  }
});

// Delete user - if logged in
router.delete("/:userId", verifyToken(), async (req, res) => {
  try {
    const removedUser = await User.deleteOne({ _id: req.params.userId });
    res.json(removedUser);
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
