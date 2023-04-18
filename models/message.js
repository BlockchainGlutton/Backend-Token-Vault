const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  file: {
    type: String,
  },
  file_name: {
    type: String,
  },
  type: {
    type: String,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", messageSchema);
