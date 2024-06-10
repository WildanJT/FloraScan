const tf = require('@tensorflow/tfjs-node');
const { Firestore } = require('@google-cloud/firestore');

const InputError = require('../exceptions/InputError');

async function requestSuggestion(label) {
    try {
        const firestoreDB = new Firestore({
            projectId: process.env.PROJECT_ID,
        });
        const suggestionCollection = firestoreDB.collection('suggestions').doc(label);
        const suggestionDoc = await suggestionCollection.get();
        
        const result = suggestionDoc.data()['suggestion'];

        return result;
    }
    catch(error) {
        console.log('Fail to request suggestion: ', error.message);
    }
}

async function predictClassification(model, image) {
    try {
        const tensor = tf.node
        .decodeImage(image)
        .resizeNearestNeighbor([256, 256])
        .expandDims()
        .toFloat()

        const prediction = model.predict(tensor);
        const score = await prediction.data();
        const confidenceScore = Math.max(...score) * 100;

        const classes = ['Bacterial', 'Fungal', 'Hama', 'Healthy', 'Virus'];

        const classResult = tf.argMax(prediction, 1).dataSync()[0];
        const label = classes[classResult];

        const suggestion = await requestSuggestion(label);

        return { confidenceScore, label, suggestion };
    } 
    catch (error) {
        throw new InputError(`Error: ${error.message}`);
    }
}

module.exports = predictClassification;
