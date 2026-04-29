require('dotenv').config();
const dbService = require('./services/dbService');
const aiService = require('./services/aiService');

/**
 * Backfill claims for articles that don't have them
 */
async function backfillClaims() {
    console.log('🔄 Starting claims backfill...');

    try {
        // Get all articles that are AI_PROCESSED or CLIP_READY but have no claims
        const { data: articles, error } = await dbService.supabase
            .from('news_items')
            .select('*')
            .in('status', ['AI_PROCESSED', 'VIDEO_FOUND', 'CLIP_READY'])
            .in('status', ['AI_PROCESSED', 'VIDEO_FOUND', 'CLIP_READY']);

        if (error) {
            console.error('❌ Error fetching articles:', error);
            return;
        }

        console.log(`📊 Found ${articles.length} articles without claims`);

        let successCount = 0;
        let failCount = 0;

        for (const article of articles) {
            try {
                console.log(`\n🔍 Processing: ${article.title.substring(0, 60)}...`);

                // Re-optimize the article to get a claim
                const optimized = await aiService.optimizeArticle(article);

                if (optimized && optimized.claims && optimized.claims.length > 0) {
                    // Update the article with the new claim
                    await dbService.updateItem(article.id, {
                        claims: optimized.claims
                    });
                    console.log(`   ✅ Added claim: "${optimized.claims[0].substring(0, 80)}..."`);
                    successCount++;
                } else {
                    console.log(`   ⚠️  No claim generated`);
                    failCount++;
                }

                // Rate limit to avoid overwhelming OpenAI
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`   ❌ Error processing article: ${err.message}`);
                failCount++;
            }
        }

        console.log(`\n✨ Backfill complete!`);
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Failed: ${failCount}`);

    } catch (error) {
        console.error('❌ Backfill error:', error);
    }

    process.exit(0);
}

backfillClaims();
