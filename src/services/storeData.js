const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Store predictions into SQL database
async function storeDataSQL(user_id, prediction_data) {
    await pool.execute('INSERT INTO predictions (user_id, prediction_data) VALUES (?, ?)', [user_id, prediction_data]);
}

module.exports = { storeDataSQL };