/**
 * Enhanced Backfill Political News from TheNewsAPI
 * Uses keyword searches to get more political content
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const dbService = require('./services/dbService');
const { v4: uuidv4 } = require('uuid');

const NEWS_API_KEY = process.env.NEWS_API_KEYS;

async function backfillPolitics() {
    if (!NEWS_API_KEY) {
        console.error('❌ NEWS_API_KEYS environment variable is required');
        process.exit(1);
    }
    if (!dbService.supabase) {
        console.error('❌ Supabase not initialized');
        process.exit(1);
    }

    console.log('🔄 Enhanced Backfill: Fetching Political News...');

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const publishedAfter = sevenDaysAgo.toISOString().split('T')[0];

    // Political search terms to maximize coverage
    const searchTerms = [
        'congress',
        'senate',
        'white house',
        'president',
        'election',
        'democrat',
        'republican',
        'legislation',
        'policy',
        'government'
    ];

    let totalIngested = 0;

    for (const term of searchTerms) {
        console.log(`\n📰 Searching for "${term}" since ${publishedAfter}...`);

        const url = `https://api.thenewsapi.com/v1/news/all?api_token=${NEWS_API_KEY}&language=en&search=${encodeURIComponent(term)}&published_after=${publishedAfter}&limit=50`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`   ❌ API Error: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error(`   Response: ${text.substring(0, 200)}`);
                continue;
            }

            const data = await response.json();
            const articles = data.data || [];

            console.log(`   Found ${articles.length} articles`);

            let newCount = 0;
            for (const article of articles) {
                // Check if already exists by URL
                const { data: existing } = await dbService.supabase
                    .from('news_items')
                    .select('id')
                    .eq('articleURL', article.url)
                    .limit(1);

                if (existing && existing.length > 0) {
                    continue; // Skip duplicate
                }

                // Map to news_items schema
                const newsItem = {
                    id: uuidv4(),
                    title: article.title,
                    summary: [article.description || article.snippet || ''],
                    imageURL: article.image_url || null,
                    articleURL: article.url,
                    sourceAPI: `API - ${article.source || 'TheNewsAPI'}`,
                    category: 'US Politics',
                    date: article.published_at,
                    status: 'INGESTED',
                    createdAt: new Date().toISOString()
                };

                const { error } = await dbService.supabase
                    .from('news_items')
                    .insert(newsItem);

                if (error) {
                    // Likely duplicate or constraint violation
                    if (!error.message.includes('duplicate')) {
                        console.error(`   Error: ${error.message}`);
                    }
                } else {
                    newCount++;
                    totalIngested++;
                }
            }

            if (newCount > 0) {
                console.log(`   ✅ Ingested ${newCount} new articles`);
            }

            // Rate limit - wait 500ms between requests
            await new Promise(r => setTimeout(r, 500));

        } catch (err) {
            console.error(`   ❌ Fetch error: ${err.message}`);
        }
    }

    console.log(`\n✅ Backfill complete! Total new articles ingested: ${totalIngested}`);
    console.log('   Run "node server/force_process.js" to process them into clips.');
}

backfillPolitics();
