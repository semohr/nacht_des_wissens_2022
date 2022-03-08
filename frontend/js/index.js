/** Simple socket io signaling server to exchange
 * audio stream between two clients.
 */
const SIGNALING_SERVER_URL = "http://localhost:8080/";
const PC_CONFIG = {};

const socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

socket.on("data", (data) => {
    console.log("Data received: ", data);
    handleSignalingData(data);
});

socket.on("ready", () => {
    console.log("Ready");
    createPeerConnection();
    sendOffer();
});

let sendData = (data) => {
    socket.emit("data", data);
};

/** Get the streaming data
 *
 */
function getLocalStream() {
    return navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
            console.log("Stream found");
            localStream = stream;
            // Connect after making sure that local stream is availble
            socket.connect();
        })
        .catch((err) => {
            console.error("Stream not found: ", err);
        });
}

let pc;
function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = onIceCandidate;
        pc.ontrack = ontrack;

        // Add local stream to peer connection
        var audioTracks = destination.stream.getAudioTracks();
        var track = audioTracks[0]; //stream only contains one audio track
        pc.addTrack(track, destination.stream);
        console.log("PeerConnection created");
    } catch (error) {
        console.error("PeerConnection failed: ", error);
    }
}

let sendOffer = () => {
    console.log("Send offer");
    pc.createOffer().then(setAndSendLocalDescription, (error) => {
        console.error("Send offer failed: ", error);
    });
};

let sendAnswer = () => {
    console.log("Send answer");
    pc.createAnswer().then(setAndSendLocalDescription, (error) => {
        console.error("Send answer failed: ", error);
    });
};

let setAndSendLocalDescription = (sessionDescription) => {
    pc.setLocalDescription(sessionDescription);
    console.log("Local description set");
    sendData(sessionDescription);
};

let onIceCandidate = (event) => {
    if (event.candidate) {
        console.log("ICE candidate");
        sendData({
            type: "candidate",
            candidate: event.candidate,
        });
    }
};

let ontrack = (event) => {
    console.log("Add stream");
    remoteStreamElement.srcObject = event.streams[0];
};

let handleSignalingData = (data) => {
    switch (data.type) {
        case "offer":
            createPeerConnection();
            pc.setRemoteDescription(new RTCSessionDescription(data));
            sendAnswer();
            break;
        case "answer":
            pc.setRemoteDescription(new RTCSessionDescription(data));
            break;
        case "candidate":
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
    }
};

/** Main functionality is defined here
 *
 *
 */

let destination;
let remoteStreamElement;

var noiseSpread;
var gain;
async function getAudio_and_applyNoise() {
    // Setup audio context
    var audioContext = new AudioContext();

    var audioInput = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Set up a stream source to extract audio from the microphone
    const source = audioContext.createMediaStreamSource(audioInput);

    // Create a gain node
    await audioContext.audioWorklet.addModule("/js/white-noise-processor.js");
    const whiteNoiseNode = new AudioWorkletNode(
        audioContext,
        "white-noise-processor",
        {
            processorOptions: { noise_type: "white" }, //you can also pass constructor arguments
        }
    );

    // Create output node this is send via webrtc
    destination = audioContext.createMediaStreamDestination();

    // Parameters of the whiteNoiseNode
    gain = whiteNoiseNode.parameters.get("customGain");
    gain.setValueAtTime(1, audioContext.currentTime);
    noiseSpread = whiteNoiseNode.parameters.get("noiseSpread");
    noiseSpread.setValueAtTime(0.02, audioContext.currentTime);

    // Connect the source to the processor and the processor to the destination
    source.connect(whiteNoiseNode);
    whiteNoiseNode.connect(destination);
}

async function main() {
    console.log("Main");
    remoteStreamElement = document.getElementById("remote-stream");
    await getAudio_and_applyNoise();
    socket.connect();
}

document.addEventListener("DOMContentLoaded", main);
