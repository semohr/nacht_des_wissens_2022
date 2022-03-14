/** Main functionality is defined here
 *
 *
 */

let destination;
let noiseSTD;
var audioContext;
async function getAudio_and_applyNoise() {
    // Setup audio context
    audioContext = new AudioContext();

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

    // Get all parameters for the audioContext and make them globally accessible
    noiseSTD = whiteNoiseNode.parameters.get("noiseSTD");

    // Connect the source to the processor and the processor to the destination
    source.connect(whiteNoiseNode);
    whiteNoiseNode.connect(destination);
}

/** Set the noise for the audiocontext node
 */
function setNoiseSTD(value) {
    console.log("[main] setNoiseSTD", value);
    noiseSTD.setValueAtTime(value, audioContext.currentTime);
}




function AppState1() {
    document.getElementById("app_state0").style.display = "none";
    document.getElementById("app_state1").style.display = "flex";


}

/** This function is called when the user clicks on the speaker
 *  button and start the app as an receiver user.
 * 
 */
var state = undefined;
async function setup_receiver() {
    console.log("[main] Receiver");
    state = "receiver";

    // Display all elements for receiver
    let doms_for_emitter = document.getElementsByClassName("emitter");
    Array.from(doms_for_emitter).forEach(function (dom) {
        dom.classList.remove("receiver");
    });

    // Set next app state
    AppState1();

    /** Connect to websocket server to receive signaling data
     * and other events. See functions defined in setup_webrtc.js
     */
    socket.connect();
}


/** This function is called when the user clicks on the microphone
 * button and start the app as an emitter user.
 */
async function setup_emitter() {
    console.log("[main] Emitter");
    state = "emitter";

    /** Init audio transmission */
    await getAudio_and_applyNoise();

    // Display all elements for emitter
    let doms_for_emitter = document.getElementsByClassName("emitter");
    Array.from(doms_for_emitter).forEach(function (dom) {
        dom.classList.remove("emitter");
    });

    // Set next app state
    AppState1();

    /** Connect to websocket server to receive signaling data
     * and other events. See functions defined in setup_webrtc.js
     */
    socket.connect();
}


/** This function is called independent of client is receiver or emitter
 * 
 */
async function main() {
    // Init the buttons
    document.getElementById("btn_emitter").addEventListener("click", setup_emitter);
    document.getElementById("btn_receiver").addEventListener("click", setup_receiver);
}


document.addEventListener("DOMContentLoaded", main);
