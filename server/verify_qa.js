const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const dbService = require('./services/dbService');

async function testQA() {
    console.log('--- QA FEATURE DIAGNOSIS ---');
    console.log(`BASE_URL: ${process.env.BASE_URL || 'Not Set (Defaulting to http://localhost:3000)'}`);
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    try {
        // 1. Get a news item ID to ask about
        console.log('1. Fetching a recent news item from DB...');
        const feed = await dbService.getReadyFeed(1);

        if (!feed || feed.length === 0) {
            console.error('❌ No news items found in DB to test with.');
            return;
        }

        const newsItem = feed[0];
        console.log(`   Found item: "${newsItem.title}" (ID: ${newsItem.id})`);

        // 2. Send QA Request to LOCAL server API
        console.log(`2. Sending QA request to ${baseURL}/api/news/qa...`);
        const payload = {
            newsId: newsItem.id,
            question: "What is this article about in one sentence?",
            userId: "debug_user"
        };

        const response = await fetch(`${baseURL}/api/news/qa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        console.log('✅ QA Request Successful!');
        console.log('--- ANSWER ---');
        console.log(data.answer);
        console.log('--------------');

    } catch (error) {
        console.error('❌ QA Request Failed');
        console.error('Error:', error.message);
    }
}

testQA();
