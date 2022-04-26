const mongoose = require("mongoose");

// Game MongoDB schema
const gameSchema = mongoose.Schema({
  level: {
    type: Number,
    required: true,
    default: 1,
  },
  name: {
    type: String,
    required: true,
  },
  codeHtml: String,
  codeCss: [
    {
      className: String,
      code: String,
    },
  ],
  colors: [String],
});

// Export model with created schema
module.exports = mongoose.model("Games", gameSchema);
