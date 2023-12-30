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
var spawn = require('child_process').spawn;
let writer = null;

function setupVideo(name) {
    return new cv.VideoWriter(name, cv.VideoWriter.fourcc("MJPG"), CAMERA_FPS, new cv.Size(480, 320), true);
}

function sendVideo(path, req, res) {
    const stat = fs.statSync(path)
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1

        const chunksize = (end - start) + 1
        const file = fs.createReadStream(path, { start, end })
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        }

        res.writeHead(206, head)
        file.pipe(res)
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(200, head)
        fs.createReadStream(path).pipe(res)
    }
}

function drawDetection(input_path, output_path, detection_id) {
    const promise = new Promise((resolve, reject) => {
        const py = spawn('python3', ['drawDetections.py', input_path, output_path]);

        py.stdout.on('end', (data) => {
            resolve();
        });

        py.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
        });

        py.stdout.on('data', (data) => {
            console.log(`Python stdout: ${data}`);
        });

        db.all("SELECT * FROM detection_clusters WHERE id = ?", [detection_id], (error, rows) => {
            if (rows.length == 0) {
                console.log("Didnt found detection");
                reject();
            }
            py.stdin.write(JSON.stringify(rows[0].bboxes));
            py.stdin.end();
        });
    });

    return promise;
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
db.run(`CREATE TABLE IF NOT EXISTS detection_clusters (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        timestamp BIGINT, 
        bboxes LONGTEXT, 
        path LONGTEXT, 
        mission_id INT,
        FOREIGN KEY (mission_id) REFERENCES missions(id));`);

function processDetections(data) {
    /* 
        This algorithm groups new detections into existing detections or creates a new ones. 
        Detection in this case means a group of yolo predictions that point to the same object but on different frames.

        This algorithm is based on k-means algorithm for classyfing bounding boxes based on distance.
        In array 'detections' we have current detections. Each record in this array has property last_frame
        which can be treated like a centroid of a detection (cluster). Each new yolo prediction is then added to a group
        with the closest centroid. If this distance is bigger then threshold new detections is added.
    */

    let used_clusters = [];

    // TODO Before adding prediction to cluster. Sort predictions based on distance for there is no race condition

    for (let i = 0; i < data.predictions.length; i++) {
        let min = { dist: 1e+6, index: null };
        for (let j = 0; j < detection_clusters.length; j++) {
            console.log(data.predictions[i], detection_clusters)
            let dist = distBetweenCenters(data.predictions[i], detection_clusters[j].bboxes.at(-1));
            if (dist < min.dist) {
                min = { dist: dist, index: j };
            }
        }

        data.predictions[i].frame = current_mission.frames;

        // Add to group
        if (min.dist < MAX_DIST && !used_clusters.includes(min.index)) {
            detection_clusters[min.index].bboxes.push(data.predictions[i]);
            used_clusters.push(min.index)
        }
        // Create a new one
        else {
            detection_clusters.push({
                timestamp: parseInt(Date.now() / 1000),
                inactive_frames: 0,
                bboxes: [data.predictions[i]],
                path: [{ "latitude": data.latitude, "longitude": data.longitude }],
            });
        }
    }

    // If any of the clusters are inactive for a long time, close it and save to DB
    for (let i = 0; i < detection_clusters.length; i++) {
        if (!used_clusters.includes(i)) {
            detection_clusters[i].inactive_frames++;
        }

        if (detection_clusters[i].inactive_frames >= MAX_INACTIVE_FRAMES) {
            db.run(`INSERT INTO detections(timestamp, bboxes, path, mission_id) VALUES(?, ?, ?, ?)`,
                [detection_clusters[i].timestamp, JSON.stringify(detection_clusters[i].bboxes), JSON.stringify(detection_clusters[i].path), current_mission.id],
                function (error) {
                    console.log(error)
                    console.log("New record added with ID " + this.lastID);
                }
            );

            detection_clusters.splice(i, 1);
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
    db.all("SELECT * FROM detection_clusters WHERE mission_id = ?", [req.params.id], (error, rows) => {
        res.render("mission.ejs", { detection_clusters: rows, mission_id: req.params.id, camera_fps: CAMERA_FPS });
    });
})

server.get("/mission-stream/:id", (req, res) => {
    const path = `mission-${req.params.id}.mp4`
    sendVideo(path, req, res);
})

server.get("/mission-stream/:mission_id/:cluster_id", async (req, res) => {
    const original_mission = `mission-${req.params.mission_id}.mp4`;
    const rerendered_mission = `/tmp/mission.mp4`;
    drawDetection(original_mission, rerendered_mission, req.params.cluster_id).then(data => {
        console.log("Sending video")
        sendVideo(rerendered_mission, req, res);
    }).catch(data => {
        console.log("There was an error while drawing bboxes");
    })
})

server.get('/stream', (req, res) => {
    res.render("stream.ejs");
})

server.get("/map", (req, res) => {
    res.render("map.ejs");
})

server.get("/reset-db", (req, res) => {
    db.run(`DELETE FROM detection_clusters`);
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
        current_mission.id = id + 1;
        current_mission.timestamp = parseInt(Date.now() / 1000);
        writer = setupVideo(`mission-${current_mission.id}.avi`);
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

    detection_clusters.forEach(det => {
        db.run(`INSERT INTO detection_clusters(timestamp, bboxes, path, mission_id) VALUES(?, ?, ?, ?)`,
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
        current_mission.frames = 0;
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
const CAMERA_FPS = 9;
let current_mission = {
    id: null, timestamp: null, path: [], frames: 0
};
let users = [];
let drone = null;
let detection_clusters = [];

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

        processDetections(data);

        current_mission.frames++;
        current_mission.path.push({ "latitude": data.latitude, "longitude": data.longitude });
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