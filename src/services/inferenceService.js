const tf = require('@tensorflow/tfjs-node');
const InputError = require('../exceptions/InputError');

async function predictClassification(model, image) {
    try {
        const tensor = tf.node
        .decodeJpeg(image)
        .resizeNearestNeighbor([224, 224])
        .expandDims()
        .toFloat()

        const prediction = model.predict(tensor);
        const score = await prediction.data();
        const confidenceScore = Math.max(...score) * 100;

        const classes = ['Bacterial', 'Fungal', 'Hama', 'Healthy', 'Virus'];

        const classResult = tf.argMax(prediction, 1).dataSync()[0];
        const label = classes[classResult];

        let suggestion;

        if (label === 'Healthy') {
            suggestion = " "
        }
    
        if (label === 'Virus') {
            suggestion = " "
        }

        if (label === 'Fungal') {
            suggestion = " "
        }
    
        if (label === 'Hama') {
            suggestion = " "
        }

        if (label === 'Bacterial') {
            suggestion = " "
        }

        return { confidenceScore, label, suggestion };
    } 
    catch (error) {
        throw new InputError(`Terjadi kesalahan input: ${error.message}`);
    }
}

module.exports = predictClassification;
