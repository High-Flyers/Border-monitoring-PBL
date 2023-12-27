// Express and http server
const express = require('express');
const http = require('http');
const server = express();
const http_server = http.createServer(server);
server.set('view engine', 'ejs');
server.set('views', './client');

// Image processing
const fs = require("fs");
const cv = require("opencv4nodejs");
const Buffer = require('buffer').Buffer;
const ffmpeg = require('fluent-ffmpeg');
let writer = null;

function setupVideo(id) {
    writer = new cv.VideoWriter(`mission-${id}.avi`, cv.VideoWriter.fourcc("MJPG"), 9, new cv.Size(480, 320), true);
}

function convert2MP4(id) {
    ffmpeg()
        .input(`mission-${id}.avi`)
        .output(`mission-${id}.mp4`)
        .on('end', function () {
            console.log('Conversion finished');
            fs.unlinkSync(`mission-${id}.avi`);
        })
        .on('error', function (err) {
            console.error('Error:', err);
        })
        .run();
}

// Database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pbl-2023.db');
db.run(`CREATE TABLE IF NOT EXISTS missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        timestamp BIGINT, 
        path LONGTEXT);`);
db.run(`CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        timestamp BIGINT, 
        bboxes LONGTEXT, 
        path LONGTEXT, 
        mission_id INT,
        FOREIGN KEY (mission_id) REFERENCES missions(id));`);

function processDetections(data) {
    let usedDetections = [];
    let yolo_detections = JSON.parse(data.predictions).predictions;

    for (let i = 0; i < yolo_detections.length; i++) {
        const detection = yolo_detections[i];
        let isUsed = false;
        for (let j = 0; j < detections.length; j++) {
            if (distBetweenCenters(detection, detections[j].last_bbox) < MAX_DIST) {
                detections[j].path.push({ "latitude": data.latitude, "longitude": data.longitude });
                detections[j].bboxes.push(yolo_detections[i]);
                usedDetections.push(j);
                isUsed = true;
                break;
            }
        }

        if (!isUsed) {
            detections.push({
                timestamp: parseInt(Date.now() / 1000),
                inactive_frames: 0,
                bboxes: [],
                path: [{ "latitude": data.latitude, "longitude": data.longitude }],
                last_bbox: detection
            });
        }
    }

    for (let i = 0; i < detections.length; i++) {
        if (!usedDetections.includes(i)) {
            detections[i].inactive_frames++;
        }

        if (detections[i].inactive_frames >= MAX_INACTIVE_FRAMES) {
            db.run(`INSERT INTO detections(timestamp, bboxes, path, mission_id) VALUES(?, ?, ?, ?)`,
                [detections[i].timestamp, JSON.stringify(detections[i].bboxes), JSON.stringify(detections[i].path), current_mission.id],
                function (error) {
                    console.log(error)
                    console.log("New record added with ID " + this.lastID);
                }
            );

            console.log("Saving detection", detections[i]);
            detections.splice(i, 1);
        }
    }
}

// Socket
const { Server } = require("socket.io");
const io = new Server(http_server);

server.use(express.static(__dirname + '/client'));
server.use(express.json({ limit: '20mb' }))
server.use(express.urlencoded({ extended: true }));

server.get('/', (req, res) => {
    res.render("index.ejs");
});

server.get('/raport', (req, res) => {
    db.all("SELECT id, timestamp, path FROM missions", (error, rows) => {
        res.render("raport.ejs", { missions: rows });
    });
})

server.get("/missions/:id", (req, res) => {
    db.all("SELECT * FROM detections WHERE mission_id = ?", [req.params.id], (error, rows) => {
        console.log(rows)
        console.log(error)
        res.render("mission.ejs", { detections: rows });
    });
})

server.get('/stream', (req, res) => {
    res.render("stream.ejs");
})

server.get("/map", (req, res) => {
    res.render("map.ejs");
})

server.get("/reset-db", (req, res) => {
    db.run(`DELETE FROM detections`);
    db.run(`DELETE FROM missions`);

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

    db.all("SELECT MAX(id) as id FROM missions", (error, rows) => {
        let id = (rows[0].id) ? rows[0].id : 0;
        current_mission.id = id;
        current_mission.timestamp = parseInt(Date.now() / 1000);
        setupVideo(id);
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
            console.log(error)
            console.log("New mission added with ID " + this.lastID);
        }
    );

    if (drone != null) {
        drone.emit("end_mission");
    }

    detections.forEach(det => {
        db.run(`INSERT INTO detections(timestamp, bboxes, path, mission_id) VALUES(?, ?, ?, ?)`,
            [det.timestamp, JSON.stringify(det.bboxes), JSON.stringify(det.path), current_mission.id],
            function (error) {
                console.log(error)
                console.log("New record added with ID " + this.lastID);
            }
        );
    })

    if (writer) {
        convert2MP4(current_mission.id);
        current_mission.id = null;
        current_mission.timestamp = null;
        current_mission.path = [];
        writer.release();
    }

    console.log("Ended mission")
    res.send("Ended mission");
})

function distBetweenCenters(box1, box2) {
    let c1 = { x: box1.x + box1.width / 2, y: box1.y + box1.height / 2 };
    let c2 = { x: box2.x + box2.width / 2, y: box2.y + box2.height / 2 };

    return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
}

const PORT = 3000;
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
    })

    socket.on("new_drone", () => {
        drone = socket;
        console.log("Added new drone")
    })

    socket.on("detection", (data) => {
        if (data.predictions === undefined ||
            data.timestamp === undefined ||
            data.latitude === undefined ||
            data.longitude === undefined) {
            console.log("Error in data");
            return;
        }

        if (writer) {
            const buffer = Buffer.from(data.image, 'base64');
            const img = cv.imdecode(buffer);
            writer.write(img)
        }

        users.forEach(u => {
            u.emit("stream", data.image);
        });

        if (current_mission.id == null) {
            console.log("Mission isnt started");
            return;
        }

        current_mission.path.push({ "latitude": data.latitude, "longitude": data.longitude });

        processDetections(data);
    })

    socket.on('disconnect', () => {
        console.log('a user disconnected');
        users = users.filter(s => s != socket);
        if (drone == socket) {
            drone = null;
        }
    });
});

http_server.listen(PORT, () => {
    console.log('listening on ' + PORT);
});