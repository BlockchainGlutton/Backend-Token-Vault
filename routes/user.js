const express = require("express");
const passport = require("passport");
const { ObjectID } = require("mongodb");
const User = require("../models/user");
const Channel = require("../models/channel");
const mime = require("mime-types");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

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

router.get("/register", (req, res) => {
  console.log(req.flash("error"));
  res.render("register", { title: "Register" });
});
router.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});
router.post(
  "/update/background",
  passport.authenticate("jwt", { session: false }),
  upload.single("profile_background"),
  (req, res) => {
    if (!ObjectID.isValid(req.user._id)) {
      return res.redirect("/");
    }

    const user = {
      profile_background: "/img/background.jpg",
    };

    if (req.file) {
      const file = {
        path: "/files/image/" + req.file.filename,
      };

      user.profile_background = file.path;
    }

    User.findByIdAndUpdate(req.user._id, user, (err, rUser) => {
      if (!err) {
        res.status(200).json({
          status: "success",
          message: "Profile Background is updated successfully.",
          data: user.profile_background,
        });
      } else {
        res.status(200).json({
          status: "error",
          message: "Error Occurred in Updating background.",
          data: err,
        });
      }
    });
  }
);

router.post(
  "/login",
  passport.authenticate("local-login", {
    failureRedirect: "/users/register",
    failureMessage: true,
  }),
  (req, res) => {
    const body = { _id: req.user._id, address: req.user.address };
    const token = jwt.sign({ user: body }, config.jwt_secret);
    User.findById(req.user._id).then((rUser) => {
      rUser.online = true;
      rUser.cardId = req.body.cardId;
      rUser.save();
      res.json({
        user: rUser,
        jwt: token,
      });
    });
  }
);

router.post(
  "/register",
  passport.authenticate("local-signup", {
    failureRedirect: "/users/register", // redirect back to the signup page if there is an error
    failureFlash: true,
  }),
  (req, res) => {
    const body = { _id: req.user._id, address: req.user.address };
    const token = jwt.sign({ user: body }, config.jwt_secret);
    User.findById(req.user._id).then((rUser) => {
      rUser.online = true;
      rUser.cardId = req.body.cardId;
      rUser.save();
      res.json({
        user: rUser,
        jwt: token,
      });
    });
  }
);

router.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findById(req.user._id).then((rUser) => {
      rUser.online = false;
      rUser.save();
      res.json(rUser);
    });
    req.logout();
  }
);

// Users Profile
router.get(
  "/@me",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.find({})
      .then((rUser) => {
        Channel.find({})
          .sort({ created_at: -1 })
          .then((rChannel) => {
            res.json({
              channels: rChannel,
              users: rUser,
            });
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        console.log(e);
      });
  }
);

// external user Profile
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findById(req.user._id)
      .populate("channels")
      .then((currentUser) => {
        User.findById(req.params.id)
          .populate("channels")
          .then((rUser) => {
            if (ObjectID(req.params.id).equals(ObjectID(req.user._id))) {
              return res.json({
                currentUserChannels: currentUser.channels,
                channels: rUser.channels,
                type: "mine",
                user: rUser,
              });
            }

            res.json({
              currentUserChannels: currentUser.channels,
              channels: rUser.channels,
              type: "user",
              user: rUser,
            });
          })
          .catch((e) => {
            console.log(e);
          });
      });
  }
);

router.post(
  "/@me/update",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findByIdAndUpdate(req.user._id, req.body, (err, rUser) => {
      if (!err) {
        res.status(200).json({
          status: "success",
          message: "Your profile updated successfully.",
          data: rUser,
        });
      } else {
        res.status(200).json({
          status: "error",
          message: "Your Alias Name is already used by others.",
          data: err,
        });
      }
    });
  }
);

module.exports = router;
