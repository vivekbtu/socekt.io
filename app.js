const express = require("express");
const http = require("http");
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

let connectedPeers = [];

io.on("connection", (socket) => {
  const socketId = socket.id;
  // const socketId = '36d7690b-1931-467a-b8f0-6977c242a2dc';
  ////////////////////////

  connectedPeers.push(socketId);

  socket.emit("your_uuid", { id: socketId }); 
  ///////////////////

  socket.on("pre-offer", (data) => {
    // console.log("pre-offer-came");
    const { calleePersonalCode, callType } = data;

    console.log('calleePersonalCode', calleePersonalCode);
    console.log('connectedPeers', connectedPeers);

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === calleePersonalCode
    );

    console.log(connectedPeer);

    if (connectedPeer) {
      const data = {
        callerSocketId: socketId,
        callType,
      };
      
      io.to(calleePersonalCode).emit("pre-offer", data);
    } else {
      const data = {
        preOfferAnswer: "CALLEE_NOT_FOUND",
      };
      io.to(socketId).emit("pre-offer-answer", data);
    }
  });

  socket.on("pre-offer-answer", (data) => {

    // console.log('pre-offer-answer-came', data)
    const { callerSocketId } = data;

    // console.log("pre-offer-answer-came", callerSocketId);

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === callerSocketId
    );

    if (connectedPeer) {
      io.to(data.callerSocketId).emit("pre-offer-answer", data);
    }
  });

  socket.on('user-hanged-up', (data) => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.close();
    }
  });

  socket.on("webRTC-signaling", (data) => {
    const { connectedUserSocketId } = data;

    // console.log('webRTC-signaling', connectedUserSocketId);

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("webRTC-signaling", data);
    }

    // console.log('werbRTC-signaling', data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");

    const newConnectedPeers = connectedPeers.filter(
      (peerSocketId) => peerSocketId !== socketId
    );

    connectedPeers = newConnectedPeers;
    console.log(connectedPeers);
  });
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
