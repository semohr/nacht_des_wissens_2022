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
    navigator.mediaDevices
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

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = onIceCandidate;
        pc.ontrack = ontrack;
        localStream.getTracks().forEach(function (track) {
            pc.addTrack(track, localStream);
        });
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
    remoteStreamElement.srcObject = event.stream;
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


let pc;
let localStream;
let remoteStreamElement;

function main(){
    console.log("Main");
    remoteStreamElement = document.getElementById("remote-stream");
    getLocalStream();
}

document.addEventListener("DOMContentLoaded", main);
