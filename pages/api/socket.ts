import { Server } from 'socket.io'
import moment from "moment"
import { writeFile, readFileSync, readdir, readdirSync } from 'fs';


interface Data {
    emitterID: string;
    receiveID: string;
    emitted: number[][], //emitted number each block
    received: number[][], //received number each block
    duration: number[][], //time ms for each event
    currentBlock: number, //Current experiment block
    start_last_event: Date, //Time of last started event
}

/** CONFIG */
var NUM_EVENTS_PER_BLOCK = 10;
var NUM_BLOCKS = 1;
var emitter = [];
var receiver = [];
var MAP = [];

/** Initialize websocket or load if already
 * running. See below for functionality.
 */
const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
    } else {
        console.log('[Socket] Socket is initializing')
        const io = new Server(res.socket.server)
        res.socket.server.io = io

        // On new client connection
        io.on('connection', socket => {
            console.log("Client connected");
            socket.on("disconnect", () => {
                //Remove id from emitter and receiver
                console.log("Client disconnected");
                var index = emitter.indexOf(socket.id);
                if (index > -1) {
                    emitter.splice(index, 1);
                }
                index = receiver.indexOf(socket.id);
                if (index > -1) {
                    receiver.splice(index, 1);
                }
            });

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
                    receiver.push(id1);
                }
            });

            socket.on("experiment:return", (receivedNum, expID) => {
                console.log("[main] Received experiment:return", receivedNum, expID);

                const map = MAP[expID];
                const currentBlock = map.currentBlock;
                const delta = moment().diff(map.start_last_event, "ms");

                // Save received number and get time delta
                map.received[currentBlock].push(receivedNum);
                map.duration[currentBlock].push(delta);

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

            // Helper functions

            function ready_pair(emitterID, receiveID) {
                console.log("ready_pair", emitterID, receiveID);
                const map: Data = {
                    "emitterID": emitterID,
                    "receiveID": receiveID,
                    "emitted": [],
                    "received": [],
                    "duration": [],
                    "currentBlock": 0,
                    "start_last_event": undefined
                }


                // Set the emitted, received shape depending on the Number of blocks
                for (let i = 0; i < NUM_BLOCKS; i++) {
                    map.emitted.push([]);
                    map.received.push([]);
                    map.duration.push([]);
                }

                MAP.push(map);
                var expID = MAP.length - 1;
                experiment_start(expID)
            }

            function experiment_event(expID) {
                const map = MAP[expID];
                const currentBlock = map.currentBlock;

                // Random integer between 1 and 9
                var random_number = Math.floor(Math.random() * 9) + 1;

                // Send random number to all clients and start timer
                map.start_last_event = moment();
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


                // Determine filename by number of files in dir
                // XXXX format padded by zeros
                const filenames = readdirSync("public/experiments");
                const fs_id = String(filenames.length).padStart(4, '0');
                const filename = "public/experiments/" + fs_id + ".json";

                io.to(map.emitterID).emit("experiment:end", fs_id);
                io.to(map.receiveID).emit("experiment:end", fs_id);

                writeFile(filename, JSON.stringify(map), function (err) {
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

        })

    }

    res.end()
}

export default SocketHandler