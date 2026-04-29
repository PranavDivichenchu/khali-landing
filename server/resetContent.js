require('dotenv').config();
const dbService = require('./services/dbService');

async function resetContent() {
    console.log('🗑️ Starting Content Reset...');

    if (!dbService.supabase) {
        console.error('❌ Supabase client not initialized. Check .env');
        process.exit(1);
    }

    // 1. Delete Aggregated Stories
    console.log('... Deleting Aggregated Stories');
    const { error: aggError } = await dbService.supabase
        .from('aggregated_stories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all

    if (aggError) console.error('   ❌ Error:', aggError.message);
    else console.log('   ✅ Cleared');

    // 2. Delete News Items
    console.log('... Deleting News Items');
    const { error: newsError } = await dbService.supabase
        .from('news_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (newsError) console.error('   ❌ Error:', newsError.message);
    else console.log('   ✅ Cleared');

    // 3. Delete Clusters
    console.log('... Deleting Event Clusters');
    const { error: clusterError } = await dbService.supabase
        .from('event_clusters')
        .delete()
        .gt('id', -1); // Assuming numeric ID, or this logic works for UUIDs typically too

    if (clusterError) console.error('   ❌ Error:', clusterError.message);
    else console.log('   ✅ Cleared');

    // 4. Reset Feed failure counts so we retry everything
    console.log('... Resetting Feed status');
    await dbService.supabase
        .from('rss_feeds')
        .update({ failureCount: 0 });

    console.log('✨ Cleanup complete. You can now run the worker to regenerate content.');
    process.exit(0);
}

// Give it a moment to initialize
setTimeout(resetContent, 1000);
