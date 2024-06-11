require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Cookie = require('@hapi/cookie');
const Jwt = require('jsonwebtoken');
const Mysql = require('mysql2/promise');

const Boom = require('@hapi/boom');

const routes = require('../server/routes');
const loadModel = require('../services/loadModel');


(async () => {
    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    // Register cookie plugin
    await server.register(Cookie);

    // Configure cookie-based session
    server.state('session', {
        ttl: 24 * 60 * 60 * 1000, // 1 day lifetime
        isSecure: process.env.NODE_ENV !== 'development' ? true : false, // true in production
        isHttpOnly: true,
        encoding: 'base64json',
        clearInvalid: true, // clear invalid cookie
        strictHeader: true
    });

    server.auth.scheme('jwt', () => ({
        authenticate: async (request, h) => {
            const session = request.state.session;
            if (!session || !session.token) {
                throw Boom.unauthorized('Missing authentication');
            }

            try {
                const decoded = Jwt.verify(session.token, process.env.JWT_SECRET);
                return h.authenticated({ credentials: decoded });
            }
            catch(error) {
                console.error('JWT Error:', error);
                throw Boom.unauthorized('Invalid token');
            }
        }
    }));

    server.auth.strategy('jwt', 'jwt');
    server.auth.default({
        mode: 'optional',
        strategy: 'jwt'
    });

    // Create MySQL connection pool
    const pool = Mysql.createPool({
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

    /*
    // Load machine learning model
    const model = await loadModel();
    server.app.model = model;   
    */ 

    server.route(routes);

    await server.start();
    console.log(`Server start at: ${server.info.uri}`);
})();