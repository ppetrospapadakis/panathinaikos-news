require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const key = process.env.GEMINI_API_KEY;
if (!key) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
}

// Default initialization (which worked in test-sdk.js)
const ai = new GoogleGenAI({ apiKey: key });

async function run() {
    try {
        console.log('Sending request to gemini-2.0-flash (default SDK config)...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: 'Say: GEMINI 2.0 WORKS',
        });
        console.log('✅ SUCCESS! Response:', response.text.trim());
    } catch (err) {
        console.error('❌ ERROR details:', err);
    }
}
run();
