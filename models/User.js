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
});

// Export model with created schema
module.exports = mongoose.model("Users", userSchema);
