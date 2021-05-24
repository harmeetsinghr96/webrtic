const connection = new WebSocket("ws://localhost:9090");

const CallingController = (() => {
  let stream = {},
    userDetails = {};

  const elements = () => {
    return {
      loginBox: document.getElementById("login_box"),
      videoBox: document.getElementById("video_box"),
      videoStream: document.getElementById("local_video_sream"),
    };
  };

  const getUserName = () => {
    const urlString = window.location.href;
    const url = new URL(urlString);
    const userName = url.searchParams.get("username");

    return userName;
  };

  const getUserMediaDevices = () => {
    const { videoStream } = elements();

    navigator.getUserMedia(
      {
        video: true,
        audio: true,
      },
      (successStream) => {
        stream = successStream;
        videoStream.srcObject = stream;
      },
      (errorStream) => {
        console.log("Streaming Error: ", errorStream);
      }
    );
  };

  const emitSocket = (_conn, type, payload) =>
    _conn.send(JSON.stringify({ type, payload }));

  const listenToSocket = (_conn, res) => {
    data = JSON.parse(res.data);
    checkResponse(_conn, data);
  };

  const checkResponse = (_conn, data) => {
    const { type, results } = data;

    switch (type) {
      case "LOGIN_LISTENER":
        loginResponse(_conn, results);
        break;
    }
  };

  const loginResponse = (_conn, results) => {
    const {
      status,
      data: { message, data },
    } = results;

    if (status === 400) {
      window.location.replace("/");
      return alert(message);
    }

    userDetails = data;
    getUserMediaDevices();
  };

  return {
    elements,
    listenToSocket,
    getUserName,
    emitSocket,
  };
})();

connection.onopen = () => console.log("Connected to the server");
connection.onerror = (error) => console.log("Socket Error: ", error);
connection.onmessage = (data) =>
  CallingController.listenToSocket(connection, data);
const userName = CallingController.getUserName();
const { loginBox, videoBox } = CallingController.elements();

if (userName != null) {
  loginBox.style.display = "none";
  videoBox.style.display = "block";
  setTimeout(() => {
    if (connection.readyState === 1) {
      let data = { user: userName };
      CallingController.emitSocket(connection, "JOINED", data);
    }
  }, 1000);
} else {
  videoBox.style.display = "none";
  loginBox.style.display = "block";
}
