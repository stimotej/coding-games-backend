const mongoose = require("mongoose");

// User MongoDB schema
const userSchema = mongoose.Schema({
  name: {
    type: String,
  },
  role: {
    type: String,
    default: "User",
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  rank: {
    type: String,
    enum: ["Begginer", "Junior", "Mid", "Senior"],
    default: "Begginer",
  },
  progressCss: {
    type: Number,
    default: 1,
  },
  score: {
    type: Number,
    default: 0,
  },
  played: [
    {
      gameId: String,
      highestScore: Number,
    },
  ],
});

// Export model with created schema
module.exports = mongoose.model("Users", userSchema);
