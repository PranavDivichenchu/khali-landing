/**
 * Backfill Political News from NewsMesh
 * Fetches political articles from the past 7 days
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const dbService = require('./services/dbService');
const newsMeshService = require('./services/newsMeshService');

async function backfillPolitics() {
    if (!dbService.supabase) {
        console.error('❌ Supabase not initialized');
        process.exit(1);
    }

    console.log('🔄 Backfilling Political News from NewsMesh...');

    // Calculate dates
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const fromDate = sevenDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    // Search terms
    const searchTerms = [
        'politics',
        'congress',
        'white house',
        'election',
        'senate',
        'legislation'
    ];

    let totalIngested = 0;

    for (const term of searchTerms) {
        console.log(`\n📰 Searching for "${term}" (${fromDate} to ${toDate})...`);

        try {
            const articles = await newsMeshService.searchArticles({
                q: term,
                from: fromDate,
                to: toDate,
                limit: 25 // Max per request allowed by plan? User said "limit: 25, max: 25" in docs?
            });

            console.log(`   Found ${articles.length} articles`);

            let newCount = 0;
            for (const article of articles) {
                // Check dupes
                const { data: existing } = await dbService.supabase
                    .from('news_items')
                    .select('id')
                    .eq('articleURL', article.articleURL)
                    .limit(1);

                if (existing && existing.length > 0) {
                    continue;
                }

                // Set category explicitly for backfill
                article.category = 'politics';

                const { error } = await dbService.supabase
                    .from('news_items')
                    .insert(article);

                if (error) {
                    if (!error.message.includes('duplicate')) {
                        console.error(`   Error: ${error.message}`);
                    }
                } else {
                    newCount++;
                    totalIngested++;
                }
            }

            if (newCount > 0) console.log(`   ✅ Ingested ${newCount} new articles`);

            // Rate limit
            await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
            console.error(`   ❌ Error: ${err.message}`);
        }
    }

    console.log(`\n✅ Backfill complete! Total new articles ingested: ${totalIngested}`);
    console.log('   Run "node server/force_process.js" to process them.');
}

backfillPolitics();
