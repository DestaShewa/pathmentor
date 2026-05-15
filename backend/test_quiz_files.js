/**
 * Test: quiz-from-files route — reads a real file from the uploads folder.
 * Run: node test_quiz_from_files.js
 */
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function test() {
    console.log("--- Testing server-side file reading for quiz ---");
    console.log("Uploads dir:", UPLOADS_DIR);

    const files = fs.readdirSync(UPLOADS_DIR).slice(0, 5);
    console.log("Sample files found:", files);

    if (files.length === 0) {
        console.log("No files found in uploads dir. Skipping extraction test.");
        return;
    }

    // Test PDF extraction
    const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));
    if (pdfFile) {
        const pdfParse = require('pdf-parse');
        const buf = fs.readFileSync(path.join(UPLOADS_DIR, pdfFile));
        const data = await pdfParse(buf);
        console.log(`\nExtracted ${data.text.length} chars from: ${pdfFile}`);
        console.log("First 500 chars:\n", data.text.slice(0, 500));
    } else {
        console.log("\nNo PDF files in uploads. Testing text file:");
        const txtFile = files[0];
        const buf = fs.readFileSync(path.join(UPLOADS_DIR, txtFile));
        const text = buf.toString('utf-8');
        console.log(`Extracted ${text.length} chars from: ${txtFile}`);
        console.log("First 500 chars:\n", text.slice(0, 500));
    }
}

test().catch(console.error);
