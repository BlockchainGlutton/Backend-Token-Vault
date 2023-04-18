const mongoose = require("mongoose");
const validator = require("validator");
const userSchema = new mongoose.Schema({
  cardId: {
    type: String,
    default: "0",
  },
  address: {
    type: String,
    unique: true,
  },
  aliasname: {
    type: String,
    unique: true,
  },
  city: {
    type: String,
    default: "",
  },
  country: {
    type: String,
    default: "",
  },
  designation: {
    type: String,
    default: "",
  },
  emailAddress: {
    type: String,
    default: "example@gmail.com",
  },
  skills: { type: Array, default: [] },
  website: {
    type: String,
    default: "https://www.example.com",
  },
  zipCode: {
    type: String,
    default: "000000",
  },
  description: {
    type: String,
    default: "Am ...",
  },
  password: {
    type: String,
    minlength: 6,
    required: true,
  },
  channels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },
  ],
  profile_picture: {
    type: String,
    default: `{"type":"animal","value":{"name":"chameleon","color":"green"}}`,
  },
  profile_background: {
    type: String,
    default: "/img/background.jpg",
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  online: {
    type: Boolean,
    default: false,
  },
  isFirst: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("User", userSchema);
