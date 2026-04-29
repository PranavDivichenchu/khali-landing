const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dbService = require('../services/dbService');

async function cleanup() {
    console.log('🧹 Cleaning up legacy NewsAPI items...');

    if (!dbService.supabase) {
        console.error('❌ Supabase not connected');
        return;
    }

    try {
        // 1. Delete news items that don't start with "RSS -"
        // Note: Supabase/PostgREST 'not.like' syntax
        const { count, error } = await dbService.supabase
            .from('news_items')
            .delete({ count: 'exact' })
            .not('sourceAPI', 'like', 'RSS - %');

        if (error) {
            console.error('Error deleting legacy items:', error.message);
        } else {
            console.log(`✅ Deleted ${count} legacy news items.`);
        }

        // 2. Optional: Clean up clusters that might be empty now?
        // For now, we'll just clean the items as requested.

        // 3. Clear aggregated stories that might be stale
        // It's safer to just wipe aggregated stories if we are doing a hard reset, 
        // but the user only asked for "posts that used the newsapi".
        // Aggregated stories don't store "sourceAPI" directly in a filterable way easily (it's in JSONB).
        // But since we just started RSS today, maybe we can delete aggregated stories created before today?
        // Let's stick to the user's explicit request first.

    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

cleanup();
