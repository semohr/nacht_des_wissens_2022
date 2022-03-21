#!/usr/bin/env node
import http from 'http';
import express from "express";
import { Server } from "socket.io";
import { writeFile, readFileSync } from 'fs';
/** CONFIG */
var NUM_EVENTS_PER_BLOCK = 2;


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
        });
        var expID = MAP.length - 1;

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
        const map = MAP[expID];
        console.log("[main] Received experiment:return", receivedNum, expID);
        map.received.push(receivedNum);

        if (map.received.length < NUM_EVENTS_PER_BLOCK) {
            experiment_event(expID)
        }
        else {
            experiment_end(expID)
        }
    });



    socket.emit("ready");


    function experiment_event(expID) {
        const map = MAP[expID];
        // Random integer between 1 and 9
        var random_number = Math.floor(Math.random() * 9) + 1;

        // Send random number to all clients
        io.to(map.emitterID).emit("experiment:event", random_number, expID);
        io.to(map.receiveID).emit("experiment:event", random_number, expID);

        map.emitted.push(random_number);

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
});


httpServer.listen(4430,() =>{
    console.info(`Server Running here 👉 https://localhost:${4430}`);
})