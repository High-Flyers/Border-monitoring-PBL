// Express and http server
const express = require('express');
const http = require('http');
const server = express();
const http_server = http.createServer(server);

// Database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pbl-2023.db');
db.run('CREATE TABLE IF NOT EXISTS detections (id INT, data LONGTEXT);');

// Socket
const { Server } = require("socket.io");
const io = new Server(http_server);

server.use(express.static(__dirname + '/client'));
server.use(express.json({ limit: '20mb' }))
server.use(express.urlencoded({ extended: true }));

server.get('/', (req, res) => {
    res.sendFile("./client/index.html", { root: __dirname });
});

server.get('/raport', (req, res) => {
    res.sendFile("./client/raport.html", { root: __dirname });
})

server.get('/stream', (req, res) => {
    res.sendFile("./client/stream.html", { root: __dirname });
})

server.post('/detection', (req, res) => {
    if (req.body.image === undefined ||
        req.body.timestamp === undefined ||
        req.body.latitude === undefined ||
        req.body.longitude === undefined) {
        res.send("Error in data");
        return;
    }

    res.send("OK");

    // Send to clients
    users.forEach(u => {
        u.emit("new_detection", req.body);
    });

    // Save to DB
    db.run(`INSERT INTO detections(data) VALUES(?)`,
        [JSON.stringify(req.body)],
        function (error) {
            console.log("New record added with ID " + this.lastID);
        }
    );
})

server.get("/reset-db", (req, res) => {
    db.run(`DELETE FROM detections`);

    res.send("OK");
});

let users = [];

io.on('connection', (socket) => {
    socket.on("new_client", ()=>{
        users.push(socket);
        console.log('a user connected');

        // Add all detection in DB
        db.all("SELECT data FROM detections", (error, rows) => {
        rows.forEach((row) => {
            socket.emit("new_detection", JSON.parse(row.data));
        })
    });
    })

    socket.on("stream", (image)=>{
        // Send to clients
        users.forEach(u => {
            u.emit("stream", image);
        });
    })

    socket.on('disconnect', () => {
        console.log('a user disconnected');
        users = users.filter(s => s != socket);
    });
});

http_server.listen(3000, () => {
    console.log('listening on *:3000');
});