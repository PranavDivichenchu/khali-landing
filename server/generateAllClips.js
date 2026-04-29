/**
 * Batch generate clips for all news items in feed.json
 */
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/clips/generate';

async function generateClips() {
    // Read feed.json
    const feedPath = path.join(__dirname, '../feed.json');
    const feedData = JSON.parse(fs.readFileSync(feedPath, 'utf8'));

    console.log(`📋 Found ${feedData.data.length} news items\n`);

    const results = [];

    for (const item of feedData.data) {
        if (!item.youtubeID) {
            console.log(`⏭️  Skipping ${item.id} - no YouTube ID`);
            continue;
        }

        console.log(`\n🎬 Generating clip for: ${item.title.substring(0, 60)}...`);
        console.log(`   YouTube ID: ${item.youtubeID}`);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: item.youtubeID,
                    startTime: 5,      // Start at 5 seconds
                    duration: 15,      // 15 second clips
                    newsId: item.id
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`   ✅ Clip created: ${result.clip.clipUrl}`);
                console.log(`   📦 Size: ${(result.clip.fileSize / 1024 / 1024).toFixed(2)} MB`);

                // Add clip URL to the item
                item.clipUrl = result.clip.clipUrl;
                item.clipDuration = result.clip.duration;
                item.thumbnailUrl = result.clip.thumbnailUrl;

                results.push({ ...item, success: true });
            } else {
                console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
                results.push({ ...item, success: false, error: result.error });
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results.push({ ...item, success: false, error: error.message });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update feed.json with clip URLs
    feedData.data = results.map(r => {
        const { success, error, ...item } = r;
        return item;
    });

    fs.writeFileSync(feedPath, JSON.stringify(feedData, null, 2));
    console.log(`\n\n✅ Updated feed.json with clip URLs`);

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total: ${results.length}\n`);
}

generateClips().catch(console.error);
