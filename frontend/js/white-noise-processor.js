// white-noise-processor.js
class WhiteNoiseProcessor extends AudioWorkletProcessor {

    static get parameterDescriptors() {
        return [{
            name: 'customGain',
            defaultValue: 1,
            minValue: 0,
            maxValue: 1,
            automationRate: 'a-rate'
        }, {
            name: 'noiseSpread',
            defaultValue: 0.02,
            minValue: 0,
            maxValue: 1,
        }]
    }

    constructor(options) {
        console.log('WhiteNoiseProcessor constructor', options);
        super(options);
    }

    /** Add white noise to the input buffer
     * 
     * @param {*} inputs 
     * @param {*} outputs 
     * @param {*} parameters 
     * @returns 
     */
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; i++) {
                const noiseSpread = parameters["noiseSpread"][i];
                const gain = parameters['customGain'][i];
                const noise = this.boxmuller(0, noiseSpread);
                outputChannel[i] = inputChannel[i] * gain + noise;
            }
        }

        return true;
    }

    boxmuller(mean, stdev) {
        var u = 0, v = 0;
        while (u === 0) u = Math.random(); //Convert [0,1) to (0,1)
        while (v === 0) v = Math.random();
        var z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * stdev + mean;
    }
}

registerProcessor('white-noise-processor', WhiteNoiseProcessor)