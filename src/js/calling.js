const connection = new WebSocket("ws://localhost:9090")

const CallingController = (() => {
    let stream;

    const elements = () => {
        return { 
            loginBox: document.getElementById('login_box'),
            videoBox: document.getElementById('video_box'),
        }
    }

    const getUserName = () => {
        const urlString = window.location.href;
        const url = new URL(urlString);
        const userName = url.searchParams.get("username");

        return userName;
    }

    const getUserMediaDevices = () => {
        navigator.getUserMedia({ video: true, audio: true }, (myStream) => {
            stream = myStream;
        }, error => {

        });
    }

    const emitSocket = (_conn, type, payload) => _conn.send(JSON.stringify({ type, payload }));

    const listenToSocket = (data) => {
        console.log(data);
    }

    return {
        elements,
        listenToSocket,
        getUserName,
        getUserMediaDevices,
        emitSocket
    }
})();

connection.onopen = () => console.log('Connected to the server');
connection.onerror = (error) => console.log('Socket Error: ', error);
connection.onmessage = (data) => CallingController.listenToSocket(data);
const userName = CallingController.getUserName();
const { loginBox, videoBox } = CallingController.elements();

if (userName != null) {
    loginBox.style.display = "none";  
    videoBox.style.display = "block";
    
    setTimeout(() => {
        let data = { user: userName };
        CallingController.emitSocket(connection, 'JOINED', data); 
        CallingController.getUserMediaDevices();
    }, 1000);
} else {
    videoBox.style.display = "none";
    loginBox.style.display = "block";  
}

 