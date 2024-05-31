const storeData = require('../services/storeData');
const { Firestore } = require('@google-cloud/firestore');

const crypto = require('crypto');

const predictClassification = require('../services/infereneService');


const postPredictHandler = async (request, h) => {
    const { image } = request.payload;
    const { model } = request.server.app;

    const { confidenceScore, label, suggestion } = await predictClassification(model, image);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {

    }

    await storeData(id, data);

    const response = h.response({

    })
    response.code();
    return response;
}