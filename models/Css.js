const mongoose = require("mongoose");

// Game MongoDB schema
const cssSchema = mongoose.Schema({
  level: {
    type: Number,
    required: true,
    default: 1,
  },
  code: String,
  solutionImage: String,
  colors: [String],
});

// Export model with created schema
module.exports = mongoose.model("Css", cssSchema);
