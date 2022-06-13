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
    mi_bits: number[], // mututal information in bits (standard units) for each block
    mi_bits_s: number[], // mututal information in bits/s (using information on timing) for each block
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
                    "start_last_event": undefined,
                    "mi_bits": [],
                    "mi_bits_s": [],
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
                //var random_number = 1 + map.emitted[currentBlock].length

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

                // calculate all stuff
                calculate_mutual_information(map)

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

/** Calculates the mutual information of the given data and 
 * adds it to the map.
 * 
 * @param map 
 */
function calculate_mutual_information(map: Data) {
    for (let i = 0; i < NUM_BLOCKS; i++) {

        // evaluate the joint probability distribution from the recorded events
        let xs = map.emitted[0];
        let ys = map.received[0];
        //console.log(xs)
        //console.log(ys)

        let size_alphabet = 9
        let Pxy = Array(size_alphabet).fill(0).map(() => Array(size_alphabet).fill(0));
        let Px = new Array(size_alphabet).fill(0);
        let Py = new Array(size_alphabet).fill(0);

        for (let j = 0; j < NUM_EVENTS_PER_BLOCK; j++) {
            Pxy[xs[j] - 1][ys[j] - 1] += 1 / NUM_EVENTS_PER_BLOCK
            Px[xs[j] - 1] += 1 / NUM_EVENTS_PER_BLOCK
            Py[ys[j] - 1] += 1 / NUM_EVENTS_PER_BLOCK
        }
        //console.log(Px)
        //console.log(Py)

        var mi = 0
        for (let ix = 0; ix < size_alphabet; ix++) {
            for (let iy = 0; iy < size_alphabet; iy++) {
                if (Pxy[ix][iy] > 0) {
                    mi += Pxy[ix][iy] * Math.log2(Pxy[ix][iy] / (Px[ix] * Py[iy]))
                }
            }
        }
        map.mi_bits[i] = mi
        //console.log(mi)

        // normalize mututal information
        var time_total = 0
        for (let j = 0; j < NUM_EVENTS_PER_BLOCK; j++) {
            time_total += map.duration[i][j]
        }
        //console.log(time_total)
        map.mi_bits_s[i] = mi * NUM_EVENTS_PER_BLOCK / (time_total / 1000)
        //console.log(map.mi_bits_s)
    }
}