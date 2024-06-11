CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
email VARCHAR(255) NOT NULL,
username VARCHAR(255) NOT NULL,
hashed_password CHAR(255) NOT NULL
);

CREATE TABLE predictions (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
prediction_data VARCHAR(255) NOT NULL,
prediction_score FLOAT(5, 2),
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE images (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
prediction_id INT,
image_data LONGBLOB,
file_name VARCHAR(255) NOT NULL,
image_encoded VARCHAR(255) NOT NULL,
mime_type VARCHAR(50) NOT NULL,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
);