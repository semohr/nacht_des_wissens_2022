// white-noise-processor.js
class WhiteNoiseProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    /** Add white noise to the input buffer
     * 
     * @param {*} inputs 
     * @param {*} outputs 
     * @param {*} parameters 
     * @returns 
     */
    process (inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; i++) {
                outputChannel[i] = inputChannel[i] + Math.random() * 0.5 - 1;
            }
        }

        return true;   
    }
}

registerProcessor('white-noise-processor', WhiteNoiseProcessor)