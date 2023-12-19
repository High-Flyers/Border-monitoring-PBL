const express = require('express');
const http = require('http');
const server = express();
const http_server = http.createServer(server);
const { Server } = require("socket.io");
const io = new Server(http_server);

server.use(express.static(__dirname + '/client'));
server.use(express.json({ limit: '10mb' }))
server.use(express.urlencoded({ extended: true }));

server.get('/', (req, res) => {
    res.sendFile("./client/index.html", { root: __dirname });
});

server.get('/raport', (req, res) => {
    res.sendFile("./client/raport.html", { root: __dirname });
})

server.post('/detection', (req, res) => {
    console.log(req.body);

    if (req.body.image === undefined ||
        req.body.timestamp === undefined ||
        req.body.latitude === undefined ||
        req.body.longitude === undefined) {
        res.send("Error in data");
        return;
    }

    res.send("OK");

    users.forEach(u => {
        u.emit("new_detection", req.body);
    });
})

let users = [];

io.on('connection', (socket) => {
    users.push(socket);
    console.log('a user connected');

    // Add all detection in DB

    socket.on('disconnect', () => {
        users = users.filter(s => s != socket);
    });
});

http_server.listen(3000, () => {
    console.log('listening on *:3000');
});