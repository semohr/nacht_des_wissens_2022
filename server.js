#!/usr/bin/env node
import http from 'http';
import express from "express";
import { Server } from "socket.io";
import { writeFile, readFileSync } from 'fs';
/** CONFIG */
var NUM_EVENTS_PER_BLOCK = 3;
var NUM_BLOCKS = 4;


/** Create our express app, this app handles all incoming 
 * GET and POST requests.
 */
const express_app = express();

// Server the frontend folder as static folder
express_app.use(express.static("frontend"));


/** Create socket.io app, this app handles all incoming
 * websocket requests.
 */
import https from 'https';
let credentials = {
    key: readFileSync('example.key', 'utf8'),
    cert: readFileSync('example.crt', 'utf8')
};
const httpServer = https.createServer(credentials, express_app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});

var ROOM = "test"
var emitter = [];
var receiver = [];
var pairs = [];

var MAP = [];
io.on("connection", (socket) => {
    console.log("Client connected");
    // Join room
    socket.join(ROOM);

    //Transfer data for webrtc
    socket.on("webrtc:data", (data) => {
        socket.broadcast.to(ROOM).emit("webrtc:data", data);
    });


    function ready_pair(emitterID, receiveID) {
        console.log("ready_pair", emitterID, receiveID);
        MAP.push({
            "emitterID": emitterID,
            "receiveID": receiveID,
            "emitted": [],
            "received": [],
            "currentBlock": 0,
        });
        var expID = MAP.length - 1;

        // Set the emitted, received shape depending on the Number of blocks
        for (let i = 0; i < NUM_BLOCKS; i++) {
            MAP[expID].emitted.push([]);
            MAP[expID].received.push([]);
        }

        experiment_start(expID)
    }

    socket.on("experiment:ready", (state) => {
        console.log("[main] Received experiment:ready", state);
        var id1 = socket.id;
        console.log("[main] id", id1);

        if (state == "emitter") {
            if (receiver.length > 0) {
                var id2 = receiver.pop();
                ready_pair(id1, id2);
            }
            else {
                emitter.push(id1);
            }
        }
        if (state == "receiver") {
            if (emitter.length > 0) {
                var id2 = emitter.pop();
                ready_pair(id2, id1);
            } else {
                receiver.push(id1);
            }
        }
    });
    socket.on("experiment:ready_receiver", (id1) => {

        if (emitter.length > 0) {
            var id2 = emitter.pop();
            ready_pair(id1, id2);
        }
        else {
            receiver.push(id);
        }
    });

    socket.on("experiment:return", (receivedNum, expID) => {
        console.log("[main] Received experiment:return", receivedNum, expID);

        const map = MAP[expID];
        const currentBlock = map.currentBlock;

        // Save received number
        map.received[currentBlock].push(receivedNum);

        if (map.received[currentBlock].length < NUM_EVENTS_PER_BLOCK) {
            experiment_event(expID)
        }
        else if (currentBlock < NUM_BLOCKS - 1) {
            map["currentBlock"]++;
            experiment_event(expID)
        } else {
            experiment_end(expID)
        }
    });



    socket.emit("ready");

    function experiment_event(expID) {
        const map = MAP[expID];
        const currentBlock = map.currentBlock;

        // Random integer between 1 and 9
        var random_number = Math.floor(Math.random() * 9) + 1;

        // Send random number to all clients
        io.to(map.emitterID).emit("experiment:event", random_number, expID);
        io.to(map.receiveID).emit("experiment:event", random_number, expID);

        // Save emitted number
        map.emitted[currentBlock].push(random_number);
        progressBar(expID);
    }

    function experiment_start(expID) {
        console.log("experiment:start");
        const map = MAP[expID];

        io.to(map.emitterID).emit("experiment:start", expID);
        io.to(map.receiveID).emit("experiment:start", expID);

        experiment_event(expID);
    }

    function experiment_end(expID) {
        console.log("experiment:end");
        const map = MAP[expID];
        io.to(map.emitterID).emit("experiment:end", expID);
        io.to(map.receiveID).emit("experiment:end", expID);

        var file = "./data_" + expID + ".json";
        writeFile(file, JSON.stringify(map), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
    }

    function progressBar(expID) {
        const map = MAP[expID];
        const currentBlock = map.currentBlock;
        const currentEvent = map.received[currentBlock].length;
        io.to(map.emitterID).emit("experiment:progressBar", currentEvent, currentBlock, NUM_EVENTS_PER_BLOCK, NUM_BLOCKS);
        io.to(map.receiveID).emit("experiment:progressBar", currentEvent, currentBlock, NUM_EVENTS_PER_BLOCK, NUM_BLOCKS);
    }

});


httpServer.listen(4430, "10.18.233.77", () => {
    console.info(`Server Running here 👉 https://localhost:${4430}`);
})