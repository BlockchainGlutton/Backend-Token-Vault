const mongoose = require("mongoose");
const validator = require("validator");

const mailSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    minlength: 1,
    unique: true,
    trim: true,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: "Not a valid Email",
    },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Mail", mailSchema);
