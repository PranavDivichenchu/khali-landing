require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const dbService = require('./services/dbService');

async function diagnose() {
    if (!dbService.supabase) {
        console.error('❌ Supabase not initialized');
        process.exit(1);
    }

    try {
        console.log('🔍 Diagnosing Category Distribution Pipeline...\n');

        // 1. Ingestion: news_items
        console.log('--- Stage 1: Ingestion (news_items) ---');
        const { data: newsItems, error: newsError } = await dbService.supabase
            .from('news_items')
            .select('category, sourceAPI');

        if (newsError) throw newsError;

        const newsCounts = {};
        const sourceCounts = {};
        const standardCategories = ['politics', 'technology', 'business', 'sports', 'entertainment', 'health', 'science', 'lifestyle', 'environment', 'world'];
        newsItems.forEach(i => {
            const cat = standardCategories.includes(i.category) ? i.category : 'Unknown';
            newsCounts[cat] = (newsCounts[cat] || 0) + 1;

            const src = i.sourceAPI || 'Unknown';
            sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });

        console.log(`Total News Items: ${newsItems.length}`);
        console.log('By Category:');
        Object.entries(newsCounts)
            .sort(([, a], [, b]) => b - a)
            .forEach(([cat, count]) => console.log(`   ${cat}: ${count}`));

        console.log('\nTop 10 Sources:');
        Object.entries(sourceCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .forEach(([src, count]) => console.log(`   ${src}: ${count}`));


        // 2. Aggregation: aggregated_stories
        console.log('\n--- Stage 3: Aggregation (aggregated_stories) ---');
        const { data: stories, error: storiesError } = await dbService.supabase
            .from('aggregated_stories')
            .select('category, status');

        if (storiesError) throw storiesError;

        const storyCounts = {};
        const statusCounts = {};

        stories.forEach(s => {
            const cat = s.category || 'Unknown';
            storyCounts[cat] = (storyCounts[cat] || 0) + 1;

            const stat = s.status || 'Unknown';
            statusCounts[stat] = (statusCounts[stat] || 0) + 1;
        });

        console.log(`Total Aggregated Stories: ${stories.length}`);
        console.log('By Category:');
        Object.entries(storyCounts)
            .sort(([, a], [, b]) => b - a)
            .forEach(([cat, count]) => console.log(`   ${cat}: ${count}`));

        console.log('\nBy Status:');
        Object.entries(statusCounts)
            .sort(([, a], [, b]) => b - a)
            .forEach(([stat, count]) => console.log(`   ${stat}: ${count}`));


    } catch (err) {
        console.error('Diagnostic error:', err);
    }
}

diagnose();
