const crypto = require('crypto');
const Jwt = require('jsonwebtoken');

const predictClassification = require('../services/inferenceService');
const { storeDataSQL } = require('../services/storeData');


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

// Login
async function userLoginHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { username, password} = request.payload;

        const hashed_password = crypto.createHash('sha256').update(password).digest('hex');

        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length >= 0) {
            const userId = rows[0].id;
            const stored_password = rows[0].hashed_password;
            if (hashed_password === stored_password) {
                const token = Jwt.sign({ id: userId, username: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
                const response = h.response({
                    status: 'Success',
                    message: 'Logged in successfully.'
                })
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

// Logout
async function userLogoutHandler(request, h) {
    try {
        const response = h.response({
            status: 'Success',
            message: 'Logged out successfully.'
        })
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

// Prediction
async function postPredictionHandler(request, h) {
    try {
        const { prediction_data } = request.payload; // needed for test only, should be deleted after
        const label = prediction_data // needed for test only, should be deleted after

        /*
        // need machine learning model to pass this section
        const { model } = request.server.app;
        const { confidenceScore, label, suggestion } = await predictClassification(model, image);

        const data = {
            prediction: label,
            score: confidenceScore,
            suggestion: suggestion
        }
        */
        
        // geting user id through authenticated credentials
        const  { id } = request.auth.credentials;

        await storeDataSQL(id, label);

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

module.exports = { userRegisterHandler, userLoginHandler, userLogoutHandler, postPredictionHandler }