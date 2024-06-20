const mysql = require('mysql2/promise');
const path = require('path');

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

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

const serviceAcountKey = JSON.parse(process.env.STORAGE_BUCKET_SA);

const storage = new Storage({
    projectID: serviceAcountKey.project_id,
    credentials: {
        client_email: serviceAcountKey.client_email,
        private_key: serviceAcountKey.private_key
    }
    //projectId: process.env.PROJECT_ID,
    //keyFilename: process.env.STORAGE_BUCKET_SA
});

// Store data into database
async function storeDataSQL(user_id, prediction_data, confidence_score, file_name, mime_type, saved_url, saved_name) {
    // Storing prediction data
    await pool.execute('INSERT INTO predictions (user_id, prediction_data, prediction_score) VALUES (?, ?, ?)', [user_id, prediction_data, confidence_score]);

    // Storing prediction image
    const [result] = await pool.execute('SELECT id FROM predictions WHERE user_id = ? ORDER BY id DESC', [user_id]);
    const prediction_id = result[0].id;

    await pool.execute('INSERT INTO images (user_id, prediction_id, file_name, mime_type, saved_url, saved_name) VALUES (?, ?, ?, ?, ?, ?)', [
        user_id,
        prediction_id,
        file_name,
        mime_type,
        saved_url,
        saved_name
    ]);
}

// Store image into storage bucket
async function storeImageBucket(image, user_id, mime_type) {
    try {
        const bucketName = process.env.BUCKET_NAME;
        const fileName = `prediction-image-${user_id}-${Date.now()}.jpg`;

        // Create temporary file path
        const tempDirPath = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDirPath)) {
            fs.mkdirSync(tempDirPath);
        }
        const tempFilePath = path.join(tempDirPath, fileName);

        // Save the image into temporary file path
        const writeStream = fs.createWriteStream(tempFilePath);
        image.pipe(writeStream);

        // Pipe the image stream to Google Cloud Storage
        await new Promise((resolve, reject) => {
            image.on('end', resolve);
            image.on('error', reject);
        });

        // Upload the temporary file path to Google Cloud Storage
        await storage.bucket(bucketName).upload(tempFilePath, {
            destination: fileName,
            resumable: false,
            gzip: true,
            metadata: {
                contentType: mime_type,
            },
        });

        // Remove temporary file path
        fs.unlinkSync(tempFilePath);

        const saved_url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        const saved_name = fileName;
        
        return {saved_url: saved_url, saved_name: saved_name};
    }
    catch(error) {
        console.error('Error storing image: ', error);
        throw error;
    }
}

// Deleting image stored
async function deleteImageBucket(saved_name) {
    try {
        const bucketName = process.env.BUCKET_NAME;
        await storage.bucket(bucketName).file(saved_name).delete();
    }
    catch(error) {
        console.error('Error deleting image: ', error);
        throw error;
    }
}

module.exports = { storeDataSQL, storeImageBucket, deleteImageBucket };