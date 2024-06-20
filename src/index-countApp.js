const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const app = express();

// create server using http rather than express
const server = http.createServer(app)

//  We must pass raw http server and not the one we create using express
const io = socketio(server)

// server (emit) -> client (recieve) -> event (countUpdated)
// client (emit) -> server (recieve) -> event (increment)

let count = 0
io.on("connection", (socket) => {
    console.log("New webSocket connection!")

    //  Send data to client (chat.js) for an event for all new connections
    socket.emit('countUpdated', count)

    //  listen to event emitted from chat.js
    socket.on("increment", () => {
        count++
        
        //  Send data for an event to all connections
        io.emit('countUpdated', count)
    })
})

// setup server to server content of public dir
const port = process.env.port || 3000;
const publicDirPath = path.join(__dirname, "../public")
app.use(express.static(publicDirPath)); 

//  start server
server.listen(port, () => {
    console.log("Server started on port " + port);
});