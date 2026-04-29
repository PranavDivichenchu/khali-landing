require('dotenv').config();
const aiService = require('../services/aiService');

async function testPodcast() {
    console.log("Testing Podcast Generation...");
    const dialogue = [
        { "speaker": "Sarah", "text": "Hello Mike, welcome to the show." },
        { "speaker": "Mike", "text": "Thanks Sarah, great to be here." }
    ];

    try {
        const response = await aiService.generatePodcast(dialogue);
        console.log("Success! Generated File:", response.audioPath);
        console.log("Captions Sample:", JSON.stringify(response.captions.slice(0, 3), null, 2));

        // Cleanup test file
        // const fs = require('fs');
        // try { fs.unlinkSync(response.audioPath); } catch(e){}
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testPodcast();
