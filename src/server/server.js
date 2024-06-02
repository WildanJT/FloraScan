require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const mysql = require('mysql2/promise');
const InputError = require('../exceptions/InputError');

const loadModel = require('../services/loadModel');


(async () => {
    const server = Hapi.server({
        port: process.env.PORT,
        host: 'localhost',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    // Create MySQL connection pool
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    // Add the pool to the server app context
    server.app.pool = pool;

    //const model = await loadModel();
    //server.app.model = model;

    server.route(routes);

    server.ext('onPreResponse', function (request, h) {
        const response = request.response;

        if (response instanceof InputError) {
            const newResponse = h.response({
                status: 'fail',
                message: 'InputError'
            })
            newResponse.code(response.statusCode)
            return newResponse;
        }

        if (response.isBoom) {
            const newResponse = h.response({
                status: 'fail',
                message: 'isBoom'
            })
            newResponse.code(response.output.statusCode)
            return newResponse;
        }

        return h.continue;
    });

    await server.start();
    console.log(`Server start at: ${server.info.uri}`);
    
})();