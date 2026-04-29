require('dotenv').config();
const aiService = require('./services/aiService');
const fs = require('fs');
const path = require('path');

// Mock article
const mockItem = {
    title: "Senate Passes Controversial Tax Bill",
    summary: ["The Senate passed the bill 51-49.", "It cuts corporate taxes significantly.", "Critics argue it increases the deficit.", "Proponents say it stimulates growth."],
    sourceAPI: "Test Source",
    isNews: true
};

async function testRundown() {
    console.log("--- Testing Rundown Generation ---");

    // 1. Optimize (Generate Text)
    const optimized = await aiService.optimizeArticle(mockItem);

    console.log("\n[Generated JSON]:");
    console.log(JSON.stringify(optimized, null, 2));

    if (!optimized) {
        console.error("Optimization failed or filtered.");
        return;
    }

    // 2. Append Claim (Ingest Logic)
    let descText = optimized.audioScript || optimized.summary.join(". ");
    if (optimized.claims && optimized.claims.length > 0) {
        console.log(`\n[Appending Claim]: ${optimized.claims[0]}`);
        descText += " " + optimized.claims[0];
    } else {
        console.warn("\n[Warning]: No claim generated.");
    }

    console.log("\n[Final TTS Text]:");
    console.log(descText);

    // 3. Generate Speech
    try {
        const audioBuffer = await aiService.generateSpeech(descText);
        const outputPath = path.join(__dirname, 'public/audio/test_rundown.mp3');

        // Ensure dir exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(outputPath, audioBuffer);
        console.log(`\n[Success] Audio saved to: ${outputPath}`);
        console.log(`Size: ${audioBuffer.length} bytes`);
    } catch (e) {
        console.error("\n[Error] TTS Generation failed:", e.message);
    }
}

testRundown();
