// Express and http server
const { deepStrictEqual } = require('assert');
const express = require('express');
const { copyFileSync } = require('fs');
const http = require('http');
const server = express();
const http_server = http.createServer(server);

// Database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pbl-2023.db');
db.run(`CREATE TABLE IF NOT EXISTS missions (
        id INT PRIMARY KEY, 
        timestamp BIGINT, 
        path LONGTEXT);`);
db.run(`CREATE TABLE IF NOT EXISTS detections (
        id INT NOT NULL PRIMARY KEY, 
        timestamp BIGINT, 
        first_frame LONGTEXT, 
        path LONGTEXT, 
        mission_id INT,
        FOREIGN KEY (mission_id) REFERENCES missions(id));`);

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

    res.send("OK");

    let usedDetections = [];
    let yolo_detections = JSON.parse(req.body.predictions).predictions;

    for (let i = 0; i < yolo_detections.length; i++) {
        const detection = yolo_detections[i];
        let isUsed = false;
        for (let j = 0; j < detections.length; j++) {
            if (distBetweenCenters(detection, detections[j].last_bbox) < MAX_DIST) {
                detections[j].path.push({ "latitude": req.body.latitude, "longitude": req.body.longitude });
                usedDetections.push(j);
                isUsed = true;
                break;
            }
        }

        if (!isUsed) {
            detections.push({
                timestamp: parseInt(Date.now() / 1000),
                inactive_frames: 0,
                first_frame: req.body.image,
                path: [{ "latitude": req.body.latitude, "longitude": req.body.longitude }],
                last_bbox: detection
            });
        }
    }

    for (let i = 0; i < detections.length; i++) {
        if (!usedDetections.includes(i)) {
            detections[i].inactive_frames++;
        }

        if (detections[i].inactive_frames >= MAX_INACTIVE_FRAMES) {
            db.run(`INSERT INTO detections(timestamp, first_frame, path, mission_id) VALUES(?, ?, ?, ?)`,
                [detections[i].timestamp, detections[i].first_frame, JSON.stringify(detections[i].path), current_mission],
                function (error) {
                    console.log("New record added with ID " + this.lastID);
                }
            );

            console.log("Saving detection", detections[i]);
            detections.splice(i, 1);
        }
    }

    // Save to DB
    // db.run(`INSERT INTO detections(data) VALUES(?)`,
    //     [JSON.stringify(req.body)],
    //     function (error) {
    //         console.log("New record added with ID " + this.lastID);
    //     }
    // );
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

    if (current_mission.id != null) {
        console.log("Mission is already started");
        res.send("Error");
        return;
    }

    db.all("SELECT MAX(id) AS id FROM missions", (error, rows) => {
        console.log(rows)
        id = rows[0].id;
        if (id == null) {
            id = 0;
        }

        current_mission.id = id;
        current_mission.timestamp = parseInt(Date.now() / 1000);
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

    db.run(`INSERT INTO missions(timestamp, path) VALUES(?, ?)`,
        [current_mission.timestamp, JSON.stringify(current_mission.path)],
        function (error) {
            console.log("New mission added with ID " + this.lastID);
        }
    );

    if (drone != null) {
        drone.emit("end_mission");
    }
    current_mission.id = null;
    current_mission.timestamp = null;
    current_mission.path = [];

    // TODO Save current detections to DB

    console.log("Ended mission")
    res.send("Ended mission");
})

function distBetweenCenters(box1, box2) {
    let c1 = { x: box1.x + box1.width / 2, y: box1.y + box1.height / 2 };
    let c2 = { x: box2.x + box2.width / 2, y: box2.y + box2.height / 2 };

    return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
}

const MAX_DIST = 30;
const MAX_INACTIVE_FRAMES = 10;
let current_mission = { id: null, timestamp: null, path: [] };
let users = [];
let drone = null;
let detections = [];

io.on('connection', (socket) => {
    socket.on("new_client", () => {
        users.push(socket);
        console.log('a user connected');

        // Add all detection in DB
        db.all("SELECT DISTINCT mission_id FROM detections", (error, rows) => {
            const missionIds = rows.map(row => row.mission_id);
            socket.emit("get_missions", missionIds);
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