const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 9090 });
const crypto = require('crypto');

const CallingController = (() => {
    let users = {};
    
    const emitSocket = (_conn, data) => {
        data = JSON.stringify(data);
        _conn.send(data);
    }

    const listenSocket = (data) => {
        data = JSON.parse(data);
        _checkPayload(data);
    }

    const _checkPayload = async (data) => {
        const { type, payload } = data;
        
        switch (type) { 
            case "JOINED": 
                _userJoined(payload)    
                break;
        }
    }

    const _userJoined = async (payload) => {
        const { user } = payload;

        console.log(`Username: ${user}, is now connected..!!`);
        let id = await crypto.randomBytes(16);
        id = id.toString('hex');
        users[user] = { id, userName: user };   
    }

    return {
        emitSocket,
        listenSocket,
    }

})();

console.log('Connected to server..!!');
wss.on("connection", (_conn) => {
    _conn.on("message", (data) => CallingController.listenSocket(data));
    _conn.on("close", () => console.log('User Disconnected..!!'));
});




