const { Firestore } = require('@google-cloud/firestore');

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

module.exports = {requestSuggestion};
