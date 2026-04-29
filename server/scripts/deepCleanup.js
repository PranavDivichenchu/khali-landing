const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dbService = require('../services/dbService');

async function deepCleanup() {
    console.log('🧹 Starting DEEP cleanup of Aggregated Stories & Clusters...');

    if (!dbService.supabase) {
        console.error('❌ Supabase not connected');
        return;
    }

    try {
        // 1. Delete all Aggregated Stories (The final posts shown in app)
        const { error: aggError, count: aggCount } = await dbService.supabase
            .from('aggregated_stories')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to "delete all" matching generic condition

        if (aggError) console.error('Error deleting aggregated stories:', aggError.message);
        else console.log(`✅ Deleted ${aggCount} aggregated stories.`);

        // 2. Unlink any remaining News Items from Clusters (so they can be re-clustered)
        const { error: unlinkError } = await dbService.supabase
            .from('news_items')
            .update({ cluster_id: null, status: 'INGESTED' })
            .neq('cluster_id', '00000000-0000-0000-0000-000000000000'); // Affects all clustered items

        if (unlinkError) console.error('Error unlinking news items:', unlinkError.message);
        else console.log(`✅ Reset cluster_id for all news items.`);

        // 3. Delete all Event Clusters
        // Note: We must do this AFTER deleting aggregated_stories because of Foreign Key constraints
        const { error: clusterError, count: clusterCount } = await dbService.supabase
            .from('event_clusters')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (clusterError) console.error('Error deleting clusters:', clusterError.message);
        else console.log(`✅ Deleted ${clusterCount} event clusters.`);

        console.log('\n✨ Database is scrubbed. The worker will now re-cluster valid RSS items fresh.');

    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

deepCleanup();
