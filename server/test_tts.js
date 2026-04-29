require('dotenv').config();
const aiService = require('./services/aiService');
const fs = require('fs');

async function testTTS() {
    console.log("Testing TTS generation...");
    try {
        const text = "This is a test of the local XTTS system. If you can hear this, it is working.";
        const buffer = await aiService.generateSpeech(text);

        const outputPath = 'test_output_xtts.wav';
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Success! Audio saved to ${outputPath}`);
        console.log(`Size: ${buffer.length} bytes`);
    } catch (error) {
        console.error("❌ Failed:", error.message);
    }
}

testTTS();
