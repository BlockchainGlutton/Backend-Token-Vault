const express = require("express");
const passport = require("passport");
const Message = require("../models/message");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post(
  "/edit/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!req.body) {
      return res.json({
        status: "failed",
        message: "Updating failed",
        data: {},
      });
    }
    Message.findByIdAndUpdate(req.params.id, req.body)
      .then((rMsg) => {
        res.json({
          status: "success",
          message: "Successfully updated",
          data: rMsg,
        });
      })
      .catch((e) => {
        console.log("Error in editing message ::>", e);
      });
  }
);

router.post(
  "/delete/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Message.findByIdAndDelete(req.params.id)
      .then((rMsg) => {
        res.status(200).json({
          status: "success",
          message: "Successfully deleted",
          data: rMsg,
        });
      })
      .catch((e) => {
        console.log("Error in Deleting message ::>", e);
      });
  }
);

module.exports = router;
