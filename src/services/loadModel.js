const tf = require('@tensorflow/tfjs-node');

async function loadModel() {
    try {
        const model = await tf.loadLayersModel(process.env.MODEL_URL);
        return model;
    }
    catch(error) {
        throw error;
    }
}

module.exports = loadModel;