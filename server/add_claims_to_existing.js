require('dotenv').config();
const dbService = require('./services/dbService');
const aiService = require('./services/aiService');

async function addClaimsToExisting() {
    console.log('🌪️ Starting re-optimization to add CLAIMS to existing articles...');

    // Get items that are ready but don't have claims
    const { data: items, error } = await dbService.supabase
        .from('news_items')
        .select('*')
        .is('claims', null)
        .order('date', { ascending: false })
        .limit(15);

    if (error) {
        if (error.message.includes('column "claims" does not exist')) {
            console.error('❌ ERROR: The "claims" column does not exist in your Supabase database yet.');
            console.error('Please run the following SQL in your Supabase SQL Editor:');
            console.error('\nALTER TABLE news_items ADD COLUMN claims JSONB;\n');
        } else {
            console.error('Error fetching items:', error);
        }
        return;
    }

    console.log(`Found ${items.length} items to re-process.`);

    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (const item of items) {
        let success = false;
        let retr1ies = 0;
        const maxRetries = 3;

        while (!success && retries < maxRetries) {
            try {
                console.log(`Processing: ${item.title}`);
                const optimized = await aiService.optimizeArticle(item);

                if (optimized && optimized.claims) {
                    console.log(`   ✅ Claims generated: ${optimized.claims.length}`);
                    await dbService.updateItem(item.id, {
                        title: optimized.title,
                        summary: optimized.summary,
                        category: optimized.category,
                        leftPerspective: optimized.leftPerspective,
                        rightPerspective: optimized.rightPerspective,
                        claims: optimized.claims,
                        isOptimized: 1
                    });
                    success = true;
                } else {
                    console.log('   ⚠️ Failed to generate claims or filtered.');
                    success = true; // Move on
                }
            } catch (err) {
                if (err.status === 429) {
                    console.log(`   ⏳ Rate limit hit. Waiting 60s (Retry ${retries + 1}/${maxRetries})...`);
                    await delay(60000);
                    retries++;
                } else {
                    console.error(`   ❌ Failed to process ${item.id}:`, err.message);
                    break;
                }
            }
        }
        // Base delay between successful items
        await delay(10000);
    }

    console.log('🏁 Re-optimization complete.');
}

addClaimsToExisting();
