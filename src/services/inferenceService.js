const tf = require('@tensorflow/tfjs-node');
const InputError = require('../exceptions/InputError');

async function predictClassification(model, image) {
    try {
        const tensor = tf.node
        .decodeImage(image)
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

        if (label === 'Bacterial') {
            suggestion = "0 "
        }
    
        if (label === 'Fungal') {
            suggestion = "1 "
        }

        if (label === 'Hama') {
            suggestion = "2 "
        }
    
        if (label === 'Healthy') {
            suggestion = "3 "
        }

        if (label === 'Virus') {
            suggestion = "4 "
        }

        return { confidenceScore, label, suggestion };
    } 
    catch (error) {
        throw new InputError(`Terjadi kesalahan input: ${error.message}`);
    }
}

module.exports = predictClassification;
