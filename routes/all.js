const express = require("express");
const { ObjectID } = require("mongodb");
const User = require("../models/user");
const Channel = require("../models/channel");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const router = express.Router();
router.get(
  "/channels",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Channel.find({})
      .sort({ created_at: -1 })
      .then((rChannel) => {
        if (!rChannel) {
          console.log("No Channel");
        }
        res.json({
          data: rChannel,
        });
      })
      .catch((e) => {
        console.log("error in getting all channels::>", e);
      });
  }
);
router.get(
  "/channel/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!req.params.id) {
      console.log("Error in Parameters");
      return;
    }
    Channel.findById(ObjectID(req.params.id))
      .sort({ created_at: -1 })
      .populate("message")
      .populate("participant")
      .then((rChannel) => {
        if (!rChannel) {
          return res.json({
            status: "error",
            message: "There is no such channel.",
            data: {},
          });
        }
        let isParticipant = false;
        const numberUser = rChannel.participant.length;
        for (let i = 0; i < numberUser; i++) {
          if (rChannel.participant[i].equals(ObjectID(req.user._id))) {
            isParticipant = true;
          }
        }
        if (isParticipant) {
          return res.json({
            status: "exist",
            message: "You are a member in this channel.",
            data: rChannel,
          });
        } else {
          return res.json({
            status: "no exist",
            message: "You are not a member in this channel",
            data: rChannel,
          });
        }
      })
      .catch((error) => {
        console.log("Error ocurred in Checking a participant status:>>", error);
      });
  }
);
router.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.find({})
      .sort({ created_at: -1 })
      .then((rUser) => {
        if (!rUser) {
          console.log("No Channel");
        }
        res.json({
          data: rUser,
        });
      })
      .catch((e) => {
        console.log("error in getting all users::>", e);
      });
  }
);
router.post(
  "/find",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.body.filter === "") {
      User.find()
        .then((rUser) => {
          if (rUser.length === 0) {
            return res.json({
              status: "no exist",
              message: "There is no such user.",
              data: [],
            });
          }
          res.json({
            status: "exist",
            message: "You found!",
            data: rUser,
          });
        })
        .catch((e) => {
          console.log("error in getting a user::>", e);
        });
    } else {
      let guy = req.body;
      if (guy.filter.length === 42) {
        User.find({ address: guy.filter })
          .then((rUser) => {
            if (rUser.length === 0) {
              return res.json({
                status: "no exist",
                message: "There is no such user.",
                data: [],
              });
            }
            res.json({
              status: "exist",
              message: "You found!",
              data: rUser,
            });
          })
          .catch((e) => {
            console.log("error in getting a user::>", e);
          });
      } else {
        const query = guy.filter;
        const regex = new RegExp(query, "i"); // i for case insensitive
        User.find({ aliasname: { $regex: regex } })
          .then((rUser) => {
            if (rUser.length === 0) {
              return res.json({
                status: "no exist",
                message: "There is no such user.",
                data: [],
              });
            }
            res.json({
              status: "exist",
              message: "You found!",
              data: rUser,
            });
          })
          .catch((e) => {
            console.log("error in getting a user::>", e);
          });
      }
    }
  }
);
router.get(
  "/issecond",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findByIdAndUpdate(req.user._id, { isFirst: false })
      .sort({ created_at: -1 })
      .then((rUser) => {
        if (!rUser) {
          console.log("No Channel");
        }
        res.json({
          data: rUser,
        });
      })
      .catch((e) => {
        console.log("error in setting isSecond status::>", e);
      });
  }
);
module.exports = router;
