const mongoose = require("mongoose");

// Game MongoDB schema
const gameSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: String,
  solutionImage: String,
  colors: [String],
  played: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
      score: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  reviews: [
    {
      type: String,
      enum: ["easy", "medium", "hard"],
    },
  ],
});

// Export model with created schema
module.exports = mongoose.model("Games", gameSchema);
