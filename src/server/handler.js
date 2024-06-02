const { storeData, storeDataSQL } = require('../services/storeData');
const { Firestore } = require('@google-cloud/firestore');

const crypto = require('crypto');

const predictClassification = require('../services/inferenceService');


// Register new user
async function userRegisterHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { username, password} = request.payload;

        const hashed_password = crypto.createHash('sha256').update(password).digest('hex');

        const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            await pool.execute('INSERT INTO users (username, hashed_password) VALUE (?, ?)', [username, hashed_password])
            const response = h.response({
                message: 'Data inserted successfully.'
            })
            response.code(201);
            return response;
        }
        else{
            const response = h.response({
                message: 'Username is already taken.'
            })
            response.code(400);
            return response;
        }
    }
    catch(error) {
        console.error('Error inserting data: ', error);
        const response = h.response({
            message: 'Error inserting data.'
        })
        response.code(500);
        return response;
    }
}

// Login
async function userLoginHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { username, password} = request.payload;

        const hashed_password = crypto.createHash('sha256').update(password).digest('hex');

        const [rows] = await pool.execute('SELECT hashed_password FROM users WHERE username = ?', [username]);
        if (rows.length >= 0) {
            const stored_password = rows[0].hashed_password;
            if (hashed_password === stored_password) {
                return h.response({ status: 'Success', message: 'Login successful.' }).code(200);
            }
            else {
                return h.response({ status: 'Fail', message: 'Wrong password.' }).code(401);
            }
        }
    }
    catch(error) {
        const response = h.response({
            status: 'Fail',
            message: 'User not found.'
        })
        response.code(400);
        return response;
    }
}

// Prediction
async function postPredictHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { prediction_data } = request.payload; // test only
        const label = prediction_data // test only

        //const { model } = request.server.app;
        //const { confidenceScore, label, suggestion } = await predictClassification(model, image);

        //const data = {
        //    prediction: label
        //    score: confidenceScore
        //}

        const secretKey = 'wildan' // need to be change for each session

        const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', [secretKey]);
        const user_id = rows[0].id;

        //await storeData(id, data);
        await storeDataSQL(user_id, label);

        const response = h.response({
            status: 'Success',
            message: 'Prediction successful.',
            //data
        })
        response.code(201);
        return response;
    }
    catch(error) {
        const response = h.response({
            status: 'Fail',
            message: 'Could not predict image.'
        })
        response.code(400);
        return response;
    }
    
}

module.exports = { userRegisterHandler, userLoginHandler, postPredictHandler }