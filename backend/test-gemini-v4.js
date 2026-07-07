require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const key = process.env.GEMINI_API_KEY;
if (!key) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: key });

async function run() {
    try {
        console.log('Sending request to gemini-1.5-flash-002 (default SDK config)...');
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-002',
            contents: 'Say: GEMINI 1.5 FLASH 002 WORKS',
        });
        console.log('✅ SUCCESS! Response:', response.text.trim());
    } catch (err) {
        console.error('❌ ERROR details:', err);
    }
}
run();
