const mysql = require('mysql2/promise');

// Create SQL pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Store data into database
async function storeDataSQL(user_id, prediction_data, confidence_score, image_data, file_name, image_encoded, mime_type) {
    // Storing prediction data
    await pool.execute('INSERT INTO predictions (user_id, prediction_data, prediction_score) VALUES (?, ?, ?)', [user_id, prediction_data, confidence_score]);

    // Storing prediction image
    const [result] = await pool.execute('SELECT id FROM predictions WHERE user_id = ? ORDER BY id DESC', [user_id]);
    const prediction_id = result[0].id;

    await pool.execute('INSERT INTO images (user_id, prediction_id, image_data, file_name, image_encoded, mime_type) VALUES (?, ?, ?, ?, ?, ?)', [
        user_id,
        prediction_id,
        image_data,
        file_name,
        image_encoded,
        mime_type
    ]);
}

// Store image into storage bucket
async function storeImageBucket() {
    //fungsi untuk upload image
    //url-nya yang di-return
    let image_url = 'undefined'

    return image_url;
}

module.exports = { storeDataSQL, storeImageBucket };