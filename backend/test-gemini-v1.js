require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const key = process.env.GEMINI_API_KEY;
if (!key) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: key, apiVersion: 'v1' });

async function run() {
    try {
        console.log('Sending request to gemini-1.5-flash (apiVersion v1)...');
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: 'Say: V1 API WORKS',
        });
        console.log('✅ SUCCESS! Response:', response.text.trim());
    } catch (err) {
        console.error('❌ ERROR details:', err);
    }
}
run();
