const connection = new WebSocket("ws://localhost:9090");

const CallingController = (() => {
  let stream = {}, userDetails = {}, rtcpConnection = {};

  const elements = () => {
    return {
      loginBox: document.getElementById("login_box"),
      videoBox: document.getElementById("video_box"),
      videoStream: document.getElementById("local_video_sream"),
      callerUserName: document.getElementById("caller_username")
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

        rtcpConnection = _CreateRtpConection();
        rtcpConnection.addStream(stream);
      },
      (errorStream) => {
        console.log("Streaming Error: ", errorStream);
      }
    );
  };

  const emitSocket = (_conn, type, payload) =>
    _conn.send(JSON.stringify({ type, payload })
  );

  const _CreateRtpConection = () => {
    const configuration = {
      "iceServers": [{
        "url": "stun:stun2.1.google.com:19302"
      }]
    };

    return new webkitRTCPeerConnection(configuration, {
      optional: [{ RtpDataChannels: true }]
    });
  };

  const returnRtcpConnection = () => {
    return rtcpConnection;
  }

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

      case "OFFER_LISTENER":
        _incomingCall(_conn, results);
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

  const _incomingCall = (_conn, results) => {
    console.log(results);
    const {
      status,
      data: { message, data: { offer, from: { userName } } },
    } = results;

    if (status === 400) {
      return alert(message);
    }

    rtcpConnection.setRemoteDescription(new RTCSessionDescription(offer));
    alert(userName);
  };

  return {
    elements,
    listenToSocket,
    getUserName,
    emitSocket,
    returnRtcpConnection
  };
})();

connection.onopen = () => console.log("Connected to the server");
connection.onerror = (error) => console.log("Socket Error: ", error);
connection.onmessage = (data) => CallingController.listenToSocket(connection, data);
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

function callNow() {
  const { callerUserName } = CallingController.elements();
  const callTo = callerUserName.value;

  if (callTo.trim().length > 0) {
    const rtcpConn = CallingController.returnRtcpConnection();
    rtcpConn.createOffer((offer) => {
      CallingController.emitSocket(connection, "OFFER", { offer, to: callTo, from: userName  });
      rtcpConn.setLocalDescription(offer);
    
    }, (error) => {
      alert("Calling can not be created..!!");
    });
  }
}