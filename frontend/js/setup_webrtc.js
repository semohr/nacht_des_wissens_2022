/** Simple socket io signaling server to exchange
 * ice candidates i.e. keys between two clients.
 * 
 * NOTE:
 * - destination variable has to be defined to send a stream
 * - also state has to be set to receiver or emitter
 */

//

const SIGNALING_SERVER_URL = "http://localhost:" + window.location.port;
const PC_CONFIG = {};
const socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

/** Once the server is ready it emits the "ready" event
 * which every client receives once in the beginning.
 * 
 * This event starts to create our PeerConnection and sends an offer
 * to the other client.
 */
socket.on("ready", () => {
    createPeerConnection(state);
    sendOffer();
});

let pc;
function createPeerConnection(state) {
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = onIceCandidate;

        // Add remote stream to peer connection if receiver
        if (state && state == "receiver") {
            pc.ontrack = ontrack;
        }
        // Add local stream to peer connection if emitter
        if (state && state == "emitter") {
            var audioTracks = destination.stream.getAudioTracks();
            var track = audioTracks[0]; //stream only contains one audio track
            pc.addTrack(track, destination.stream);
        }
        console.log("PeerConnection created");
    } catch (error) {
        console.error("PeerConnection failed: ", error);
    }
}

function onIceCandidate(event) {
    if (event.candidate) {
        console.log("ICE candidate");
        sendData({
            type: "candidate",
            candidate: event.candidate,
        });
    }
};

function ontrack(event) {
    remoteStreamElement.srcObject = event.streams[0];
};



/** After creating the offer we set and than send the local description
 * to the other client.
*/
function sendOffer() {
    pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then(setAndSendLocalDescription, (error) => {
            console.error("Send offer failed: ", error);
        });
};
function setAndSendLocalDescription(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    sendData(sessionDescription);
};
function sendData(data) {
    socket.emit("webrtc:data", data);
};




/** If the socket is connected and we receive any data we 
 * handle it by calling the handleSignalingData function.
 * 
 * Depending on the data type we respond to the other client
*/
socket.on("webrtc:data", (data) => {
    handleSignalingData(data);
});

function handleSignalingData(data) {
    switch (data.type) {
        case "offer":
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

function sendAnswer() {
    pc.createAnswer()
        .then(setAndSendLocalDescription, (error) => {
            console.error("Send answer failed: ", error);
        });
};


let remoteStreamElement;
function main_webrtc() {
    // Set remote stream dom which is used to "display" the audio
    remoteStreamElement = document.getElementById("remote-stream");

    // If remote stream not found we print an error
    if (!remoteStreamElement) {
        console.error("Remote stream element not found! Please set element with 'remote-stream' id");
    }
}

document.addEventListener("DOMContentLoaded", main_webrtc);

