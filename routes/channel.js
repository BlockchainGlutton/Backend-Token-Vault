const express = require("express");
const { ObjectID } = require("mongodb");
const multer = require("multer");
const mime = require("mime-types");
const path = require("path");
const crypto = require("crypto");
const User = require("../models/user");
const middleware = require("../middleware/index");
const Channel = require("../models/channel");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "../public/files/image"),
    filename: (req, file, cb) => {
      crypto.pseudoRandomBytes(4, (err, raw) => {
        const mimeType = mime.lookup(file.originalname);
        // throw away any extension if provided
        const nameSplit = file.originalname.split(".").slice(0, -1);
        // nameSplit.pop();

        // replace all white spaces with - for safe file name on different filesystem
        const name = nameSplit.join(".").replace(/\s/g, "-");
        cb(null, raw.toString("hex") + name + "." + mime.extension(mimeType));
      });
    },
  }),
});

router.post(
  "/new",
  passport.authenticate("jwt", { session: false }),
  upload.single("channel_picture"),
  (req, res) => {
    if (!ObjectID.isValid(req.user._id)) {
      return res.redirect("/");
    }
    let channel = {};
    if (req.body.type === "pchannel") {
      let participants = req.body.participant.split(",");
      channel = {
        creator: req.user._id,
        channel_name: req.body.channel_name,
        type: req.body.type,
        participant: participants,
      };
    } else {
      channel = {
        creator: req.user._id,
        channel_name: req.body.channel_name,
        type: req.body.type,
      };
    }

    if (req.file) {
      const file = {
        path: "/files/image/" + req.file.filename,
      };

      channel.channel_picture = file.path;
    }

    User.findById(req.user._id).then((rUser) => {
      if (!rUser) {
        console.log("No Users");
      }

      Channel.create(channel)
        .then((rChannel) => {
          rUser.channels.push(rChannel._id);
          rUser.save();
          rChannel.participant.push(rUser._id);
          rChannel.save();
          res.json({ current: rChannel._id });
        })
        .catch((e) => {
          console.log(e);
        });
    });
  }
);

router.post(
  "/private/new",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!ObjectID.isValid(req.user._id)) {
      return res.status(200).json({
        status: "error",
        message: "That is not a valid id",
        data: {},
      });
    }
    const channel = {
      creator: req.user._id,
      channel_name: req.body.channel_name,
      channel_picture: req.body.channel_picture,
      participant: req.body.participant,
      type: "private",
    };
    User.findById(req.user._id).then((rUser) => {
      if (!rUser) {
        console.log("No Users");
      }

      Channel.create(channel)
        .then((rChannel) => {
          rUser.channels.push(rChannel._id);
          rUser.save();
          res.json({ current: rChannel._id });
        })
        .catch((e) => {
          console.log(e);
        });
    });
  }
);

router.post(
  "/group/new",
  passport.authenticate("jwt", { session: false }),
  upload.single("channel_picture"),
  (req, res) => {
    if (!ObjectID.isValid(req.user._id)) {
      return res.status(200).json({
        status: "error",
        message: "That is not a valid id",
        data: {},
      });
    }
    let participants = req.body.participant.split(",");
    participants.push(req.user._id);
    const channel = {
      creator: req.user._id,
      channel_name: req.body.channel_name,
      participant: participants,
      type: "group",
    };

    if (req.file) {
      const file = {
        path: "/files/image/" + req.file.filename,
      };
      channel.channel_picture = file.path;
    }
    User.findById(req.user._id).then((rUser) => {
      if (!rUser) {
        console.log("No Users");
      }

      Channel.create(channel)
        .then((rChannel) => {
          rUser.channels.push(rChannel._id);
          rUser.save();
          res.json({ current: rChannel._id });
        })
        .catch((e) => {
          console.log(e);
        });
    });
  }
);

router.post(
  "/upload",
  passport.authenticate("jwt", { session: false }),
  upload.single("msg_file"),
  (req, res) => {
    if (!ObjectID.isValid(req.user._id)) {
      return res.json({
        status: "error",
        msg: "Please logout and log in again.",
        data: {},
      });
    }

    let file_path = "";
    if (req.file) {
      let req_file = req.file;
      let type_detail = req_file.mimetype.split("/");
      let file_type = type_detail[0];
      const file = {
        path: "/files/image/" + req.file.filename,
      };
      file_path = file.path;
      return res.json({
        status: "uploaded",
        data: {
          path: file_path,
          type: file_type,
        },
      });
    }
  }
);

router.get(
  "/join/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
      return res.json({
        status: "error",
        msg: "Please logout and log in again.",
        data: {},
      });
    }
    Channel.findById(ObjectID(req.params.id))
      .sort({ created_at: -1 })
      .populate("message")
      .populate("participant")
      .then((rChannel) => {
        if (!rChannel) {
          return res.json({
            status: "error",
            msg: "There is no such channel.",
            data: "error",
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
            msg: "You are already in that channel.",
            data: rChannel,
          });
        } else {
          return res.json({
            status: "no exist",
            msg: "Please join this channel.",
            data: rChannel,
          });
        }
      })
      .catch((error) => {
        console.log("Error ocurred in Checking a participant status:>>", error);
      });
  }
);

router.post(
  "/join/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
      return res.json({
        status: "error",
        msg: "Please log out and log in again",
        data: {},
      });
    }
    Channel.findById(ObjectID(req.params.id))
      .sort({ created_at: -1 })
      .populate("message")
      .populate("participant")
      .then((rChannel) => {
        User.findById(req.user._id).then((rUser) => {
          rUser.channels.push(rChannel._id);
          rUser.save();
          rChannel.participant.push(req.user._id);
          rChannel.save();
          return res.json({
            status: "joined",
            msg: "You have joined successfully.",
            data: rChannel,
          });
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
);

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  middleware.isChannelParticipant,
  (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
      console.log(req.params.id, "error");
    }

    Channel.findById(ObjectID(req.params.id))
      .sort({ created_at: -1 })
      .populate({ path: "message", populate: { path: "author" } })
      .populate("participant")
      .then((rChannel) => {
        if (!rChannel) {
          console.log("No Channel");
        }

        User.findById(req.user._id)
          .populate("channels")
          .then((rUser) => {
            Channel.find({})
              .then((all) => {
                res.json({
                  channel: rChannel,
                  channels: all,
                  title: rChannel.channel_name,
                });
              })
              .catch((e) => {
                console.log(e);
              });
          });
      })
      .catch((e) => {
        console.log(e);
      });
  }
);

router.post(
  "/private/check",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!req.body) {
      console.log("no body");
      return;
    }
    Channel.find({
      type: "private",
      channel_name: req.body.channel_name,
      creator: req.body.creator,
    })
      .populate("message")
      .populate("participant")
      .then((rChannel) => {
        if (rChannel.length === 0) {
          return res.json({
            status: "no exist",
            message: "There is no such channel",
            data: {},
          });
        }
        res.status(200).json({
          status: "exist",
          message: "You can join there",
          data: rChannel[0],
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
);

router.post(
  "/delete/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
      return res.json({
        status: "error",
        msg: "Please logout and log in again.",
        data: {},
      });
    }
    Channel.findByIdAndDelete(req.params.id, (err, rChannel) => {
      if (err) {
        return res.status(200).json({
          status: "error",
          data: err,
          message: "Server Error.",
        });
      }
      User.findByIdAndUpdate(
        req.user._id,
        {
          $pullAll: {
            channels: [{ _id: req.params.id }],
          },
        },
        (err, rUser) => {
          if (err) {
            return res.status(200).json({
              status: "error",
              data: err,
              message: "Server Error.",
            });
          }
          return res.status(200).json({
            status: "success",
            data: rChannel,
            message: "Deleted successfully.",
          });
        }
      );
    });
  }
);

module.exports = router;
