const FormData = require('form-data');
const axios = require('axios');

async function forwardToFlask(image, filename) {
    const form = new FormData();
    form.append('image', image, filename);

    try {
        const response = await axios.post(process.env.FLASK_URL, form, {
            headers: {
                ...form.getHeaders(),
            }
        });

        return response.data;
    }
    catch(error){
        throw error
    }
}

module.exports = forwardToFlask