const { Firestore } = require('@google-cloud/firestore');
const crypto = require('crypto');
const storeData = require('../services/storeData');

const registerHandler = async (request, h) => {
    // Proses data masukan dari permintaan
    const { username, password } = request.payload;

    // Lakukan validasi data, misalnya pastikan panjang username dan password memenuhi syarat tertentu

    // Simpan data pengguna ke database (misalnya Firestore)
    const firestore = new Firestore();
    const usersCollection = firestore.collection('users');

    const userExists = await usersCollection.doc(username).get();
    if (userExists.exists) {
        return h.response({ message: 'Username already exists' }).code(400);
    }

    // Hash password sebelum disimpan
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    await usersCollection.doc(username).set({
        password: hashedPassword
    });

    return h.response({ message: 'User registered successfully' }).code(201);
};

const loginHandler = async (request, h) => {
    // Proses data masukan dari permintaan
    const { username, password } = request.payload;

    // Lakukan validasi data, misalnya pastikan panjang username dan password memenuhi syarat tertentu

    // Cek kecocokan username dan password di database
    const firestore = new Firestore();
    const usersCollection = firestore.collection('users');

    const userDoc = await usersCollection.doc(username).get();
    if (!userDoc.exists) {
        return h.response({ message: 'User not found' }).code(404);
    }

    // Bandingkan password yang dihash dengan yang disimpan di database
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const userData = userDoc.data();
    if (userData.password !== hashedPassword) {
        return h.response({ message: 'Invalid credentials' }).code(401);
    }

    return h.response({ message: 'Login successful' }).code(200);
};

module.exports = { registerHandler, loginHandler };
