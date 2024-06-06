const crypto = require('crypto');
const Jwt = require('jsonwebtoken');

const predictClassification = require('../services/inferenceService');
const { storeDataSQL } = require('../services/storeData');


// Registering new user
async function userRegisterHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { username, password} = request.payload;

        const hashed_password = crypto.createHash('sha256').update(password).digest('hex');

        // Checking if the given username already exist in database
        const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            // Inserting user credentials into database
            await pool.execute('INSERT INTO users (username, hashed_password) VALUE (?, ?)', [username, hashed_password])
            const response = h.response({
                status: 'Success',
                message: 'Registered successfully.'
            })
            response.code(201);
            return response;
        }
        else{
            const response = h.response({
                status: 'Fail',
                message: 'Username is already taken.'
            })
            response.code(400);
            return response;
        }
    }
    catch(error) {
        console.error('Error inserting data: ', error);
        const response = h.response({
            status: 'Fail',
            message: 'Failed to register.'
        })
        response.code(500);
        return response;
    }
}

// Logging in
async function userLoginHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { username, password} = request.payload;

        const hashed_password = crypto.createHash('sha256').update(password).digest('hex');

        // Verifying user login credentials with the one from database
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length >= 0) {
            const userId = rows[0].id;
            const stored_password = rows[0].hashed_password;
            // Authenticating credentials
            if (hashed_password === stored_password) {
                // Creating a token for the user consist of user id and username
                const token = Jwt.sign({ id: userId, username: username }, process.env.JWT_SECRET, { expiresIn: '1h' }); 
                const response = h.response({
                    status: 'Success',
                    message: 'Logged in successfully.'
                })
                // Creating session with the token
                response.state('session', { token });
                response.code(200);
                return response;
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
        response.code(401);
        return response;
    }
}

// Logging out
async function userLogoutHandler(request, h) {
    try {
        const response = h.response({
            status: 'Success',
            message: 'Logged out successfully.'
        })
        // Clearing session
        response.unstate('session');
        response.code(200);
        return response;
    }
    catch(error) {
        const response = h.response({
            status: 'Fail',
            message: 'Unable to unstate session.'
        })
        response.code(500);
        return response;
    }
}

// Posting a Prediction
async function postPredictionHandler(request, h) {
    try {
        // Getting image from the request
        const { image } = request.payload;
        const filename = image.hapi.filename;
        const mime_type = image.hapi.headers['content-type'];

        // Reading the image content
        const imageBuffer = await new Promise((resolve, reject) => {
            const chunks = [];
            image.on('data', chunk => chunks.push(chunk));
            image.on('end', () => resolve(Buffer.concat(chunks)));
            image.on('error', err => reject(err));
        });

        const { model } = request.server.app;
        const { confidenceScore, label, suggestion } = await predictClassification(model, imageBuffer);

        const data = {
            prediction: label,
            score: confidenceScore,
            suggestion: suggestion
        };
        
        // Getting user credentials through the authentication
        const  { id } = request.auth.credentials;

        await storeDataSQL(id, data.prediction, data.score, imageBuffer, filename, mime_type);

        const response = h.response({
            status: 'Success',
            message: 'Prediction successful.',
            result: data
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

// Getting predictions history
async function getPredictionHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { id } = request.auth.credentials;
        const [data] = await pool.execute('SELECT predictions.id, predictions.prediction_data, predictions.timestamp, images.file_name FROM predictions JOIN images ON predictions.id = images.prediction_id WHERE predictions.user_id = ?', [id]);
        
        const response = h.response({
            status: 'Success',
            predictions: data
        })
        response.code(200);
        return response;
    }
    catch(error) {
        const response = h.response({
            status: 'Fail',
            message: 'Could not get predictions.'
        })
        response.code(400);
        return response;

    }
}

module.exports = { 
    userRegisterHandler, 
    userLoginHandler, 
    userLogoutHandler, 
    postPredictionHandler, 
    getPredictionHandler 
}