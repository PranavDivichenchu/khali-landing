require('dotenv').config();
const stockVideoService = require('../services/stockVideoService');

async function testPexels() {
    const query = process.argv[2] || "sunny forest";
    const category = process.argv[3] || "Nature";

    console.log(`Testing Pexels Search...`);
    console.log(`Query: "${query}"`);
    console.log(`Category: "${category}"`);
    console.log(`API Key: ${process.env.PEXELS_API_KEY ? "Present" : "MISSING"}`);

    if (!process.env.PEXELS_API_KEY) {
        console.error("❌ Aborting: No API Key found in .env");
        return;
    }

    const start = Date.now();
    const result = await stockVideoService.searchVideo(query, category);
    const duration = Date.now() - start;

    console.log(`\n--- Result (${duration}ms) ---`);
    if (result) {
        console.log(`✅ Success! Video URL found:`);
        console.log(result);
    } else {
        console.log(`❌ No video found.`);
    }
}

testPexels();
