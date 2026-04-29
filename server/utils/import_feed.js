const fs = require('fs');
const path = require('path');
const dbService = require('../services/dbService');

const FEED_PATH = path.join(__dirname, '../feed.json');

async function importFeed() {
    try {
        console.log('📖 Reading feed.json...');
        const feedData = JSON.parse(fs.readFileSync(FEED_PATH, 'utf8'));
        const items = feedData.data || [];

        console.log(`🔍 Found ${items.length} items in feed.json. Starting import...`);

        let newItems = 0;
        let updatedItems = 0;

        for (const item of items) {
            // Check if item already exists
            const existing = dbService.db.prepare('SELECT id, status FROM news_items WHERE id = ?').get(item.id);

            if (!existing) {
                // New item
                dbService.saveNewsItem({
                    id: item.id,
                    title: item.title,
                    summary: item.summary,
                    imageURL: item.imageURL,
                    sourceAPI: item.sourceAPI,
                    date: item.date,
                    category: item.category || 'Current',
                    articleURL: item.articleURL,
                    status: item.youtubeID ? 'VIDEO_FOUND' : 'INGESTED'
                });

                if (item.youtubeID) {
                    dbService.updateItem(item.id, { youtubeID: item.youtubeID });
                }
                newItems++;
            } else {
                // Update existing if it has a youtubeID but no status yet
                if (item.youtubeID && (existing.status === 'INGESTED' || !existing.youtubeID)) {
                    dbService.updateItem(item.id, {
                        youtubeID: item.youtubeID,
                        status: existing.status === 'INGESTED' ? 'VIDEO_FOUND' : existing.status
                    });
                    updatedItems++;
                }
            }
        }

        console.log(`✅ Import complete!`);
        console.log(`   - New items added: ${newItems}`);
        console.log(`   - Items updated with YouTube IDs: ${updatedItems}`);

        const stats = dbService.db.prepare('SELECT status, COUNT(*) as count FROM news_items GROUP BY status').all();
        console.log('\n📊 Current Database Status:');
        stats.forEach(s => console.log(`   - ${s.status}: ${s.count}`));

    } catch (error) {
        console.error('❌ Import failed:', error.message);
    }
}

importFeed();
