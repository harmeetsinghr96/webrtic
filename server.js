const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({ port: 9090 });

wss.on("connection", (conn) => {
    console.log('User connected');
    
    conn.on("message", (message) => {
        console.log('User connected');
    });
    
    conn.on("close", (message) => {
        console.log('Connection Closed');
    });

    conn.send("Hello World"); 
});

function sendToOtherUser(conn, msg) {
    connection.send(JSON.stringify(msg));    
}


