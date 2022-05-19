const router = require("express").Router();
const User = require("../models/User");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const { registerValidation, loginValidation } = require("../validation");
const verifyToken = require("./verifyToken");

// Get list of users - if logged in
router.get("/", verifyToken, async (req, res) => {
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
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    res.json({ message: err });
  }
});

// Get single user by id - if logged in
router.get("/:userId", verifyToken, async (req, res) => {
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
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("Email already exists");

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // Create user
  const user = new User({
    name: req.body.name,
    username: req.body.username,
    password: hashedPassword,
    email: req.body.email,
  });

  // Save user to MongoDB
  try {
    const savedUser = await user.save();
    res.json(savedUser);
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
router.patch("/:userId", verifyToken, async (req, res) => {
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
router.delete("/:userId", verifyToken, async (req, res) => {
  try {
    const removedUser = await User.remove({ _id: req.params.userId });
    res.json(removedUser);
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
