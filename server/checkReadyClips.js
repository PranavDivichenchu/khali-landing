require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const dbService = require('./services/dbService');

async function countReadyClips() {
    if (!dbService.supabase) {
        console.error('❌ Supabase not initialized. Check .env file.');
        process.exit(1);
    }

    try {
        console.log('🔄 Checking for ready clips in Supabase...');
        const { data, count, error } = await dbService.supabase
            .from('aggregated_stories')
            .select('id, title, clipUrl, category, status', { count: 'exact' })
            .eq('status', 'CLIP_READY');

        if (error) {
            console.error('❌ Error fetching clips:', error.message);
            process.exit(1);
        }

        console.log(`\n🎬 Total CLIP_READY items (Database Count): ${count}`);
        console.log(`📉 Fetched items (Current Page Limit): ${data.length}`);

        const withUrl = data.filter(s => s.clipUrl && s.clipUrl.length > 0).length;
        console.log(`✅ Items with clipUrl: ${withUrl} / ${data.length}`);

        const catCounts = {};
        data.forEach(s => {
            const cat = s.category || 'Unknown';
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        console.log('\nBy Category:');
        Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]).forEach(cat => {
            console.log(`   - ${cat}: ${catCounts[cat]}`);
        });

        if (withUrl > 0) {
            console.log('\nSample items with clipUrl:');
            data.filter(s => s.clipUrl && s.clipUrl.length > 0).slice(0, 5).forEach(s => {
                console.log(`   - [${s.category}] ${s.title}`);
                console.log(`     URL: ${s.clipUrl}`);
            });
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

countReadyClips();
