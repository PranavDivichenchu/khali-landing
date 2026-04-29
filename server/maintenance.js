require('dotenv').config();
const dbService = require('./services/dbService');
const geminiService = require('./services/geminiService');

async function recategorizeCurrentItems() {
    console.log('🧹 Starting re-categorization of "Current" items...');

    // Get items that are currently marked as 'Current'
    const { data: items, error } = await dbService.supabase
        .from('news_items')
        .select('*')
        .eq('category', 'Current')
        .limit(20);

    if (error) {
        console.error('Error fetching items:', error);
        return;
    }

    console.log(`Found ${items.length} items to re-categorize.`);

    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (const item of items) {
        try {
            console.log(`Analyzing: ${item.title}`);
            const optimized = await geminiService.optimizeArticle(item);

            if (optimized && optimized.category !== 'Current') {
                console.log(`   New Category: ${optimized.category}`);
                await dbService.updateItem(item.id, {
                    category: optimized.category,
                    leftPerspective: optimized.leftPerspective,
                    rightPerspective: optimized.rightPerspective
                });
            } else {
                console.log('   Stayed as Current or filtered.');
            }

            // Wait 2 seconds between requests to stay under free tier rate limits
            await delay(2000);

        } catch (err) {
            console.error(`   Failed to process ${item.id}:`, err.message);
        }
    }

    console.log('✅ Re-categorization complete.');
}

recategorizeCurrentItems();
