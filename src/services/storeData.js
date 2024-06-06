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
async function storeDataSQL(user_id, prediction_data, confidence_score, image_data, file_name, mime_type) {
    // Storing prediction data
    await pool.execute('INSERT INTO predictions (user_id, prediction_data, prediction_score) VALUES (?, ?, ?)', [user_id, prediction_data, confidence_score]);
    
    // Storing prediction image
    const [result] = await pool.execute('SELECT id FROM predictions ORDER BY id DESC');
    const prediction_id = result[0].id;
    await pool.execute('INSERT INTO images (user_id, prediction_id, image_data, file_name, mime_type) VALUES (?, ?, ?, ?, ?)', [
        user_id,
        prediction_id,
        image_data,
        file_name,
        mime_type
    ]);
}

module.exports = { storeDataSQL };