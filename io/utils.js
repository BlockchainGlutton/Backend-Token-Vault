const { ObjectID } = require("mongodb");
const User = require("../models/user");
const Message = require("../models/message");
const Channel = require("../models/channel");

const utils = {};

utils.saveMessage = function saveMessage(io, data) {
  User.findById(ObjectID(data.userID))
    .then((rUser) => {
      let file_name_full = data.file.split("/");
      let file_name = file_name_full[file_name_full.length - 1];
      const msg = {
        text: data.message,
        author: rUser,
        file: data.file,
        type: data.type,
        file_name: file_name,
      };
      Message.create(msg)
        .then((rMsg) => {
          Channel.findByIdAndUpdate(ObjectID(data.channelID))
            .then((rChannel) => {
              rChannel.message.push(rMsg);
              rChannel.save();
              io.to(data.channelID).emit("newMessage", {
                msg: rMsg,
                channel: data.channelID,
              });
              io.sockets.emit("notification", data);
            })
            .catch((e) => {
              console.log(e);
            });
        })
        .catch((e) => {
          console.log(e);
        });
    })
    .catch((e) => {
      console.log(e);
    });
};

utils.updateMsgStatus = function saveMessage(io, data) {
  Message.findByIdAndUpdate(data.msgID, { read: true })
    .then((rMessage) => {
      io.to(data.channelID).emit("msg-updated", data.msgID);
    })
    .catch((e) => {
      console.log(e);
    });
};

utils.announceMessage = function announceMessage(io, data) {
  User.findById(ObjectID(data.userID))
    .then((rUser) => {
      const msg = {
        author: rUser,
      };
      io.to(data.channelID).emit("isTyping", msg);
    })
    .catch((e) => {
      console.log(e);
    });
};

utils.leaveChannel = function leaveChannel(io, data) {
  Channel.findByIdAndUpdate(data.channelID, { participant: data.participant })
    .then((rChannel) => {
      io.to(data.channelID).emit("removed-participant", {
        channel: rChannel,
        removed: data.removedID,
      });
    })
    .catch((e) => {
      console.log(e);
    });
};
utils.addNewMember = function addNewMember(io, data) {
  Channel.findByIdAndUpdate(data.channelID, { participant: data.participant })
    .then((rChannel) => {
      io.to(data.channelID).emit("added-participant", {
        channel: rChannel,
      });
    })
    .catch((e) => {
      console.log(e);
    });
};

module.exports = utils;
