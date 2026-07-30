/**
 * Local Test Script for Instagram News Card Generation
 */
const fs = require('fs');
const path = require('path');
const { createNewsCardBuffer } = require('./instagram_poster');

async function testLocalCardGeneration() {
    console.log('Testing local 1080x1350 Instagram News Card generation...');
    
    const sampleTitle = 'Ξεκάθαρος ο Νίστρουπ ενόψει ΠΑΟΚ: «Είμαστε έτοιμοι για τη μεγάλη μάχη στη Λεωφόρο»';
    const sampleImage = 'https://picsum.photos/800/600'; // Random test sports photo

    try {
        const cardBuffer = await createNewsCardBuffer(sampleTitle, sampleImage);
        const outputPath = path.join(__dirname, 'test_card_output.jpg');
        fs.writeFileSync(outputPath, cardBuffer);
        console.log('✅ News Card generated successfully!');
        console.log(`Saved test output to: ${outputPath}`);
    } catch (err) {
        console.error('❌ Error generating test card:', err);
    }
}

testLocalCardGeneration();
