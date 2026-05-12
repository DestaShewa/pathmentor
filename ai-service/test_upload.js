const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    try {
        // Create a dummy PDF file buffer to upload
        const form = new FormData();
        const dummyPDF = Buffer.from('%PDF-1.4... dummy content');
        form.append('file', dummyPDF, { filename: 'test.pdf', contentType: 'application/pdf' });

        const response = await axios.post('http://localhost:5001/api/ai/extract-text', form, {
            headers: form.getHeaders(),
        });
        console.log("SUCCESS:", response.data);
    } catch (err) {
        console.error("FAILED. Status:", err.response?.status);
        console.error("Error data:", err.response?.data);
    }
}

testUpload();
