const express = require("express");
const Mail = require("../models/mail");
const router = express.Router();

router.post("/add", (req, res) => {
  Mail.create(req.body, (err, rMail) => {
    if (err) {
      return res.json({
        status: "error",
        message: err,
        data: "",
      });
    } else {
      res.json({
        status: "success",
        message: "Your mail address is registered successfully.",
        data: rMail,
      });
    }
  });
});

module.exports = router;
