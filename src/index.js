const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require('../src/utils/messages.js')
const { generateLocationMessage } = require('../src/utils/messages.js')
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users.js')

const app = express();

// create server using http rather than express
const server = http.createServer(app)

//  We must pass raw http server and not the one we create using express
const io = socketio(server)

let msg = "welcome!"
io.on("connection", (socket) => {
    console.log("New webSocket connection!")

    socket.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        // allows us to send data to specific user in the room
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))

        // allows us to send data to every user except current user in the room
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        
        // allows us to send data to every user in the room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // send message to a particular user
    // socket.emit('message', generateMessage(msg))

    // send message to all other users except newly connected user
    // socket.broadcast.emit('message', generateMessage('A new user has joined!'))

    // callback to acknowledge the received message
    socket.on('sendMessage', (message, callback) => {
        // console.log('on sendMessage')
        const user = getUser(socket.id)

        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity not allowed')
        }

        // console.log(user)

        // send message to all active connections
        // io.to(user.room).emit(generateMessage('message', generateMessage(message)))
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    // event on user disconnect
    socket.on('disconnect', () => {
        console.log("user has disconnected!")
        const user = removeUser(socket.id)
        if (user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
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