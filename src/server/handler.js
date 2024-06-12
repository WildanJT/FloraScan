const crypto = require('crypto');
const FormData = require('form-data');

const Jwt = require('jsonwebtoken');
const axios = require('axios');

const { requestSuggestion } = require('../services/giveSuggestion');
const { storeDataSQL } = require('../services/storeData');


const isValidEmail = (email) => {
    // Formated as string@string.string
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// Registering new user
async function userRegisterHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { email, username, password} = request.payload;

        if (!email||!username||!password) {
            const response = h.response({
                status: 'Fail',
                message: 'Please fill out all the requirements.'
            })
            response.code(400);
            return response;
        }

        const hashed_password = crypto.createHash('sha256').update(password).digest('hex');

        // Checking email format
        if (isValidEmail(email)) {
            // Checking if the given email already exist in database
            const [emails] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
            if (emails.length === 0) {
                // Checking if the given username already exist in database
                const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
                if (users.length === 0) {
                    // Inserting user credentials into database
                    await pool.execute('INSERT INTO users (email, username, hashed_password) VALUE (?, ?, ?)', [email, username, hashed_password])
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
            else{
                const response = h.response({
                    status: 'Fail',
                    message: 'Email is already registered.'
                })
                response.code(400);
                return response;
            }
        }
        else{
            const response = h.response({
                status: 'Fail',
                message: 'Please use a valid email address.'
            })
            response.code(400);
            return response;
        }
    }
    catch(error) {
        console.error('Error inserting data: ', error);
        const response = h.response({
            status: 'Fail',
            message: error.message
        })
        response.code(500);
        return response;
    }
}

// Logging in
async function userLoginHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { emailOrUsername, password} = request.payload;

        const hashed_password = crypto.createHash('sha256').update(password).digest('hex');

        if (isValidEmail(emailOrUsername)) {
            // Verifying user login credentials with the one from database
            const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [emailOrUsername]);
            if (rows.length > 0) {
                const userId = rows[0].id;
                const username = rows[0].username;
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
                    return h.response({ status: 'Fail', message: 'Wrong password.' }).code(400);
                }
            }
            else {
                return h.response({ status: 'Fail', message: 'No user data found.' }).code(400);
            }
        }
        else {
            // Verifying user login credentials with the one from database
            const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [emailOrUsername]);
            if(rows.length > 0) {
                const userId = rows[0].id;
                const username = rows[0].username;
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
                    return h.response({ status: 'Fail', message: 'Wrong password.' }).code(400);
                }
            }
            else {
                return h.response({ status: 'Fail', message: 'No user data found.' }).code(400);
            }
        }
    }
    catch(error) {
        const response = h.response({
            status: 'Fail',
            message: error.message
        })
        response.code(500);
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
            message: error.message
        })
        response.code(500);
        return response;
    }
}

// Posting a Prediction
async function postPredictionHandler(request, h) {
    try {
        const payload = request.payload;
                
        // Check if 'image' key exists in the payload
        if (!payload || !payload.image) {
            throw Boom.badRequest('Image file is required');
        }

        // Getting image from the request
        const image = payload.image;
        const filename = image.hapi.filename;
        const mime_type = image.hapi.headers['content-type'];


        // Append the image into request form
        const form = new FormData();
        form.append('image', image._data, {
            filename: filename,
            contentType: mime_type
        });

        // Forward the request form to the Flask server
        const flask_response = await axios.post(process.env.FLASK_URL, form, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${form._boundary}`
            }
        });

        // Picking up the data receive from Flask server
        const flask_data = flask_response.data;
        const { predicted_class, confidence_score } = flask_data;
        const data = {
            prediction: predicted_class,
            score: confidence_score*100,
            suggestion: await requestSuggestion(predicted_class)
        }

        // Reading the image content
        const imageBuffer = await new Promise((resolve, reject) => {
            const chunks = [];
            image.on('data', chunk => chunks.push(chunk));
            image.on('end', () => resolve(Buffer.concat(chunks)));
            image.on('error', err => reject(err));
        });

        // Convert the binary data to a Buffer
        const buffer = Buffer.from(imageBuffer, 'binary');

        // Encode the Buffer as a Base64 string
        const image_encoded = buffer.toString('base64');
        
        // Getting user credentials through the authentication
        const  { id } = request.auth.credentials;

        await storeDataSQL(id, data.prediction, data.score, imageBuffer, filename, image_encoded, mime_type);

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
            message: error.message
        })
        response.code(500);
        return response;
    }
}

// Getting predictions history
async function getPredictionHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { id } = request.auth.credentials;
        const [data] = await pool.execute('SELECT predictions.id, predictions.prediction_data, predictions.timestamp, images.file_name, images.image_encoded, images.mime_type FROM predictions JOIN images ON predictions.id = images.prediction_id WHERE predictions.user_id = ?', [id]);
        
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
            message: error.message
        })
        response.code(500);
        return response;
    }
}

// Deleting prediction history
async function deletePredictionHandler(request, h) {
    try {
        const { pool } = request.server.app;
        const { predictionId } = request.query;
        const { id } = request.auth.credentials;
        const [rows] = await pool.execute('SELECT * FROM predictions WHERE id = ? AND user_id = ?', [predictionId, id])
        if (rows.length > 0) {
            await pool.execute('DELETE FROM predictions WHERE id = ? AND user_id = ?', [predictionId, id]);
            const response = h.response({
                status: 'Success',
                message: 'Prediction deleted.'
            })
            response.code(200);
            return response;
        }
        else {
            return h.response({ status: 'Fail', message: 'Couldn\'t find prediction.' }).code(400);
        }
    }
    catch(error) {
        const response = h.response({
            status: 'Fail',
            message: error.message
        })
        response.code(500);
        return response;
    }
}

module.exports = { 
    userRegisterHandler, 
    userLoginHandler, 
    userLogoutHandler, 
    postPredictionHandler, 
    getPredictionHandler, 
    deletePredictionHandler, 
}