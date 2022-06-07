const mongoose = require("mongoose");

// User MongoDB schema
const userSchema = mongoose.Schema({
  name: {
    type: String,
  },
  image: String,
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
  levelsPassed: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    default: 0,
  },
  played: [
    {
      game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Games",
      },
      highestScore: Number,
    },
  ],
});

// Export model with created schema
module.exports = mongoose.model("Users", userSchema);
