require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const { Firestore } = require('@google-cloud/firestore');
const crypto = require('crypto');

(async () => {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: 'localhost',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    // Inisialisasi Firestore
    const firestore = new Firestore();

    // Buat koleksi "users" jika belum ada
    const usersCollection = firestore.collection('users');

    // Tambahkan fungsi preHandler untuk menambahkan model ke permintaan sebelum diproses
    server.ext('onPreHandler', async (request, h) => {
        request.app.firestore = firestore;
        request.app.usersCollection = usersCollection;
        return h.continue;
    });

    server.route(routes);

    await server.start();
    console.log(`Server start at: ${server.info.uri}`);
})();
