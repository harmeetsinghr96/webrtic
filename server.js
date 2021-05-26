const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ port: 9090 });
const crypto = require("crypto");

const CallingController = (() => {
  let users = {};

  const emitSocket = (_conn, data) => {
    data = JSON.stringify(data);
    if (_conn) {
      _conn.send(data);
    }
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

      case "OFFER":
        _createCallOffer(_conn, payload);
        break;
      case "ANSWER":
        _answeredCall(_conn, payload);
        break;
      case "CANDIDATE":
        _handlerCandidate(_conn, payload);
        break;
      case "REJECTED":
        _rejectedCall(_conn, payload);
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

  const _createCallOffer = (_conn, payload) => {
    let { offer, to, from } = payload;
    to = to.toLowerCase();
    from = from.toLowerCase();

    const callToConnection = users[to];  
    if (callToConnection !== null) {
      users[from].otherUser = users[to].user;
      sendResponse(callToConnection, "OFFER_LISTENER", 200, { message: 'Call time', data: { offer, from: users[from].user, to: users[to].user }});
    } else {
      sendResponse(_conn, "OFFER_LISTENER", 400, { message: 'User is not found into records.!!', data: {}});
    }
  }

  const _answeredCall = (_conn, payload) => {
    let { answer, from, to } = payload;
    from = from.userName.toLowerCase();
    to = to.userName.toLowerCase();

    const answerToConnection = users[to];  
    if (answerToConnection !== null) {
      users[from].otherUser = users[to].user;

      sendResponse(answerToConnection, "ANSWER_LISTENER", 200, { message: 'answered time', data: { answer, from: users[from].user, to: users[to].user }});
    } else {
      sendResponse(_conn, "ANSWER_LISTENER", 400, { message: 'Failed in response answer.!!', data: {}});
    }
  }

  const _rejectedCall = (_conn, payload) => {
    let { offer, from, to } = payload;
    from = from.userName.toLowerCase();
    to = to.userName.toLowerCase();

    const rejectToConnection = users[to];  
    if (rejectToConnection !== null) {
      sendResponse(rejectToConnection, "REJECTED_LISTENER", 200, { message: 'Call has been rejected by other user', data: { offer, from: users[from].user, to: users[to].user }});
    } else {
      sendResponse(_conn, "REJECTED_LISTENER", 400, { message: 'Error in rejection.!!', data: {}});
    }
  }

  const _handlerCandidate = (_conn, payload) => {
    let { candidate, user } = payload;
    user = user.toLowerCase();

    const connectCandidate = users[user];
    if (connectCandidate !== null) {
      sendResponse(connectCandidate, "CANDIDATE_LISTENER", 200, { message: 'Candidate Established..!!', data: { candidate }});
    } else {
      sendResponse(_conn, "CANDIDATE_LISTENER", 400, { message: 'Candidate can not be initialized.!!', data: {}});
    }
  }

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
