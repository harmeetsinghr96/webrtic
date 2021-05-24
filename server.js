const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ port: 9090 });
const crypto = require("crypto");

const CallingController = (() => {
  let users = {};

  const emitSocket = (_conn, data) => {
    data = JSON.stringify(data);
    _conn.send(data);
  };

  const sendResponse = (_conn, type, status, data) => {
    emitSocket(_conn, { type, results: { status, data } });
  };

  const listenSocket = (_conn, data) => {
    data = JSON.parse(data);
    _checkPayload(_conn, data);
  };

  const _checkPayload = async (_conn, data) => {
    const { type, payload } = data;

    switch (type) {
      case "JOINED":
        _userJoined(_conn, payload);
        break;
    }
  };

  const _userJoined = async (_conn, payload) => {
    let { user } = payload;
    let id = await crypto.randomBytes(5);
    id = id.toString("hex");
    user = user.toLowerCase();

    if (users[user]) {
      if (users[user].user.userName === user) {
        return sendResponse(_conn, "LOGIN_LISTENER", 400, {
          message: "Please try again with other username",
          data: {},
        });
      }
    }

    users[user] = _conn;
    users[user].user = { id, userName: user };
    console.log(`Username: ${user}, is now connected..!!`);
    sendResponse(_conn, "LOGIN_LISTENER", 200, {
      message: "Registration Successfull",
      data: users[user].user,
    });
  };

  return {
    emitSocket,
    listenSocket,
  };
})();

console.log("Connected to server..!!");
wss.on("connection", (_conn) => {
  _conn.on("message", (data) => CallingController.listenSocket(_conn, data));
  _conn.on("close", () => console.log("User Disconnected..!!"));
});
