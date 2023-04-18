const {
  saveMessage,
  announceMessage,
  updateMsgStatus,
  leaveChannel,
  addNewMember,
} = require("../io/utils");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("join", (params, callback) => {
      if (params.prevID !== "") {
        socket.leave(params.prevID);
        socket.join(params.channelID);
      } else {
        socket.join(params.channelID);
      }
      callback();
    });

    socket.on("createdMessage", (data, callback) => {
      saveMessage(io, data);
      callback();
    });

    socket.on("received", (data) => {
      updateMsgStatus(io, data);
    });

    socket.on("typing", (data) => {
      announceMessage(io, data);
    });

    socket.on("create-channel", (_channel) => {
      io.sockets.emit("added-channel", { data: _channel });
    });

    socket.on("private-channel", (_channel) => {
      io.sockets.emit("added-private", { data: _channel });
    });

    socket.on("create-group", (data) => {
      io.sockets.emit("added-group", { data: data });
    });

    socket.on("leave-channel", (data) => {
      leaveChannel(io, data);
    });

    socket.on("channel-deleted", (data) => {
      io.to(data.channelID).emit("deleted-channel", data);
      socket.leave(data.channelID);
    });

    socket.on("add-new-member", (data) => {
      addNewMember(io, data);
    });

    socket.on("leave-channel-with-id", (id) => {
      socket.leave(id);
    });

    socket.on("disconnect", () => {
      // console.log("Diconected");
    });
  });
};
