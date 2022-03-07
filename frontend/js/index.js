/** Main entry point for the frontend client, requires socket.io
 * to be loaded previously.
 */
const SERVER = 'http://localhost:8080/';

// To create a new connection to the signaling server
socket = io.connect(SERVER);

socket.on('connect', function () {
    console.log('Connected to server');

    // Send an empty join message to create a new room.
});



/** Main entry point for the frontend app 
 * 
 * - Get audio stream
 * - Setup noise on audio
 * - Stream to other client
*/
var gain;
var noiseSpread;
var audioContext;
async function main() {
    // Setup audio context to be able to add noise
    audioContext = new AudioContext();

    // Get streammedia device from user
    const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Set up a stream source to extract audio from the microphone
    const source = audioContext.createMediaStreamSource(microphone);

    // Load audio worklet processor
    await audioContext.audioWorklet.addModule('/js/white-noise-processor.js');
    const whiteNoiseNode = new AudioWorkletNode(audioContext, 'white-noise-processor',
        {
            processorOptions: { noise_type: "white" } //you can also pass constructor arguments
        });

    // Parameters of the whiteNoiseNode
    gain = whiteNoiseNode.parameters.get('customGain')
    gain.setValueAtTime(1, audioContext.currentTime);
    noiseSpread = whiteNoiseNode.parameters.get('noiseSpread')
    noiseSpread.setValueAtTime(0.02, audioContext.currentTime);

    // Connect the source to the processor and the processor to the destination
    source.connect(whiteNoiseNode).connect(audioContext.destination);

    // Start the audio context
    audioContext.resume();
}
document.addEventListener('DOMContentLoaded', main)