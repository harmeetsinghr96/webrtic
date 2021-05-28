const connection = new WebSocket("ws://localhost:9090");

const CallingController = (() => {
  let stream = {}, userDetails = {}, rtcpConnection = {}, offerToUser = "", dataChannel = {};

  const elements = () => {
    return {
      loginBox: document.getElementById("login_box"),
      videoBox: document.getElementById("video_box"),
      videoStream: document.getElementById("local_video_sream"),
      callerUserName: document.getElementById("caller_username"),
      otherCallerVideoStream: document.getElementById("other_local_video_sream")
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
    const user = getUserName();

    navigator.getUserMedia(
      {
        video: true,
        audio: true,
      },
      (successStream) => {
        stream = successStream;
        videoStream.srcObject = stream;

        rtcpConnection = _CreateRtpConection();
        _addingStreams();
        _initOnIceCandidate();
        _initDataChannelForMessage();
      },
      (errorStream) => {
        console.log("Streaming Error: ", errorStream);
      }
    );
  };

  const _addingStreams = () => {
    rtcpConnection.addStream(stream);
    rtcpConnection.onaddstream = (event) => {
      if (event.stream) {
        elements().otherCallerVideoStream.srcObject = event.stream;
      } else {
        alert('Error in other user streaming..');
      }
    };
  }

  const _initOnIceCandidate = () => {
    rtcpConnection.onicecandidate = (event) => {
      if (event.candidate) {
        emitSocket(connection, "CANDIDATE", { candidate: event.candidate, user: offerToUser });
      }
    }
  }

  const _initDataChannelForMessage = () => {
    dataChannel = rtcpConnection.createDataChannel("oneTwoOneChat", {
      reliable: true
    });
    dataChannel.onerror = (error) => {
      console.log('Data Channel Error', error);
    }
    dataChannel.onmessage = (data) => {
      console.log('Message data', data);

      dataChannel.send() // send message using this send // add data in brackets (msg); 
    }
    dataChannel.onclose = () => {
      console.log('Data Channel has been closed');
    }
  }

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
      case "ANSWER_LISTENER":
        _callAnsweredByuser(_conn, results);
        break;
      case "CANDIDATE_LISTENER":
        _handleCandidate(_conn, results);
        break;
      case "REJECTED_LISTENER":
        _rejectedCallByUser(_conn, results);
        break;
      case "LEAVE_LISTENER":
        _userLeft(_conn, results);
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
    const {
      status,
      data: { message, data: { offer, from, to } },
    } = results;

    if (status === 400) {
      return alert(message);
    }

    rtcpConnection.setRemoteDescription(new RTCSessionDescription(offer));
    if (confirm("Incoming Call")) {
      _answerCall({ offer, from, to });
    } else {
      _rejectCall({ offer, from, to });
    }
  };

  const _rejectCall = (data) => {
    const { offer, from, to } = data;
    emitSocket(connection, "REJECTED", { offer, from: to, to: from  });
  }

  const _answerCall = (data) => {
    rtcpConnection.createAnswer((answer) => {
      const { from, to } = data;
      rtcpConnection.setLocalDescription(answer);
      emitSocket(connection, "ANSWER", { answer, from: to, to: from  });
    }, (error) => {
      alert('Error, in answering call.');
    })
  }

  const _callAnsweredByuser = (_conn, results) => {
    const {
      status,
      data: { message, data: { answer, from, to } },
    } = results;

    if (status === 400) {
      return alert(message);
    }

    rtcpConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  const _rejectedCallByUser = (_conn, results) => {
    const {
      status,
      data: { message, data: { answer, from, to } },
    } = results;

    if (status === 400) {
      return alert(message);
    }

    alert(message);
  }

  const _userLeft = (_conn, results) => {
    elements().otherCallerVideoStream.srcObject = null;
    stream = null;
    rtcpConnection.close();
    rtcpConnection.onicecandidate = null;
    rtcpConnection.onaddstream = null;
  }

  const _handleCandidate = (_conn, results) => {
    const {
      status,
      data: { message, data: { candidate } },
    } = results;

    if (status === 400) {
      return alert(message);
    }

    rtcpConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  const returnOfferTouser = (toUser) => {
    offerToUser = toUser;
    return offerToUser;
  }

  const returnStream = () => {
    return stream;
  }
  
  return {
    elements,
    listenToSocket,
    getUserName,
    emitSocket,
    returnRtcpConnection,
    returnOfferTouser,
    returnStream
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
      CallingController.returnOfferTouser(callTo);
      CallingController.emitSocket(connection, "OFFER", { offer, to: callTo, from: userName  });
      rtcpConn.setLocalDescription(offer);
    }, (error) => {
      alert("Calling can not be created..!!");
    });
  }
}

function toggleVideo() {
  const stream = CallingController.returnStream();
  stream.getVideoTracks()[0].enable = !(stream.getVideoTracks()[0].enabled);
}

function toggleAudio() {
  const stream = CallingController.returnStream();
  stream.getAudioTracks()[0].enable = !(stream.getAudioTracks()[0].enabled);
}

function hangupCall() {
  CallingController.emitSocket(connection, "LEAVE", { user: userName });
}