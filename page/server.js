// Express and http server
const express = require('express');
const { copyFileSync } = require('fs');
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

server.get("/map", (req, res) => {
    res.sendFile("./client/map.html", { root: __dirname });
})

server.post('/detection', (req, res) => {
    if (req.body.predictions === undefined ||
        req.body.timestamp === undefined ||
        req.body.latitude === undefined ||
        req.body.longitude === undefined ||
        req.body.image == undefined) {
        res.send("Error in data");
        return;
    }

    console.log(req.body)

    res.send("OK");

    // Each detection has:
    // - last bbox on image
    // - path (list of drone positions)
    // - first frame
    // - timestamp
    // - inactive frames

    // Algo:
    // Loop through detections from yolo, 
    // Loop through current detections,
    // If IOU is greater then X, classify yolo detection to current detection
    // 

    // TODO Group detections
    // for (let i = 0; i < detections.length; i++) {
    //     if (detections)
    // }

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

server.get('/start-mission', (req, res) => {
    if (drone == undefined) {
        console.log("Drone in not connected yet")
        res.send("Error")
        return;
    }

    if (current_mission != null) {
        console.log("Mission is already started");
        res.send("Error");
        return;
    }

    db.all("SELECT COUNT(*) as row_count FROM detections", (error, rows) => {
        current_mission = rows[0].row_count;
    });

    drone.emit("start_mission");

    console.log("Started mission")
    res.send("Started mission");
})

server.get("/end-mission", (req, res) => {
    if (current_mission == null) {
        console.log("Mission is already ended");
        res.send("Error");
        return;
    }

    if (drone != null) {
        drone.emit("end_mission");
    }
    current_mission = null;

    // TODO Save current mission to DB

    console.log("Ended mission")
    res.send("Ended mission");
})

function iou(box1, box2) {
    const x1 = box1.x;
    const y1 = box1.y;
    const w1 = box1.width;
    const h1 = box1.height;

    const x2 = box2.x;
    const y2 = box2.y;
    const w2 = box2.width;
    const h2 = box2.height;

    const intersectionX = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
    const intersectionY = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
    const intersectionArea = intersectionX * intersectionY;

    // Calculate the union area
    const unionArea = w1 * h1 + w2 * h2 - intersectionArea;

    // Calculate IOU
    const iou = unionArea === 0 ? 0 : intersectionArea / unionArea;

    return iou;
}

let current_mission = null;
let users = [];
let drone = null;
let detections = [];

io.on('connection', (socket) => {
    socket.on("new_client", () => {
        users.push(socket);
        console.log('a user connected');

        // Add all detection in DB
        db.all("SELECT data FROM detections", (error, rows) => {
            rows.forEach((row) => {
                socket.emit("new_detection", JSON.parse(row.data));
            })
        });
    })

    socket.on("new_drone", () => {
        drone = socket;
        console.log("Added new drone")
    })

    socket.on("stream", (image) => {
        users.forEach(u => {
            u.emit("stream", image);
        });
    })

    socket.on('disconnect', () => {
        console.log('a user disconnected');
        users = users.filter(s => s != socket);
        if (drone == socket) {
            drone = null;
        }
    });
});

http_server.listen(3000, () => {
    console.log('listening on *:3000');
});