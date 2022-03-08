#!/usr/bin/env node
import http from 'http';
import express from "express";
import { Server } from "socket.io";


/** Create our express app, this app handles all incoming 
 * GET and POST requests.
 */
const express_app = express();

// Server the frontend folder as static folder
express_app.use(express.static("frontend"));


/** Create socket.io app, this app handles all incoming
 * websocket requests.
 */
const httpServer = http.createServer(express_app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});

var ROOM = "test"

io.on("connection", (socket) => {
    console.log("Client connected");
    // Join room
    socket.join(ROOM);
    socket.emit("ready");

    socket.on("data", (data) => {
        console.log("Data received: ", data);
        socket.broadcast.to(ROOM).emit("data", data);
    });
});


httpServer.listen(8080, () => {
    console.info(`Server Running here 👉 http://localhost:${8080}`);
});


/**/ 
/* In theory it is quite easy to enable https but you need to 
create a certificate and key file first. */
/*
import fs from 'fs';
import https from 'https';
let credentials = {
   key: fs.readFileSync('key.pem', 'utf8'),
   cert: fs.readFileSync('cert.pem', 'utf8')
};
let serverHttps = https.createServer(sslOptions, app).listen(443,() =>{
    console.info(`Server Running here 👉 https://localhost:${443}`);
})
*/