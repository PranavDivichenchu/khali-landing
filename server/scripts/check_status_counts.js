require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error("❌ Stats check failed: Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkStats() {
    console.log("📊 Checking Database Stats for Failed/Pending items...\n");

    const statuses = [
        'PENDING', 'PROCESSING', 'FAILED',
        'FAILED_YOUTUBE', 'FAILED_CLIP', 'FAILED_DOWNLOAD',
        'AI_PROCESSED', 'VIDEO_FOUND', 'CLIP_READY', 'INGESTED'
    ];

    console.log("--- News Items ---");
    // Since Supabase doesn't support GROUP BY easily via client without RPC, we'll fetch counts for common failed statuses
    for (const status of ['FAILED_YOUTUBE', 'FAILED_CLIP', 'FAILED_DOWNLOAD', 'FAILED_NO_VIDEO', 'FAILED_AI_OPTIMIZE']) {
        const { count, error } = await supabase
            .from('news_items')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);

        if (count > 0) console.log(`${status}: ${count}`);
    }

    console.log("\n--- Aggregated Stories ---");
    for (const status of ['FAILED_YOUTUBE', 'FAILED_CLIP', 'FAILED_DOWNLOAD', 'FAILED_NO_VIDEO', 'FAILED_AI_OPTIMIZE']) {
        const { count, error } = await supabase
            .from('aggregated_stories')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);

        if (count > 0) console.log(`${status}: ${count}`);
    }

    console.log("\n--- Total 'FAILED' prefix check ---");
    // Just grab all FAILED% if possible? Supabase client doesn't do LIKE on status count efficiently without fetching? 
    // Actually .like() works.
    const { count: failedNews } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true })
        .like('status', 'FAILED%');
    console.log(`News Items with ANY 'FAILED%' status: ${failedNews}`);

    const { count: failedAgg } = await supabase
        .from('aggregated_stories')
        .select('*', { count: 'exact', head: true })
        .like('status', 'FAILED%');
    console.log(`Aggregated Stories with ANY 'FAILED%' status: ${failedAgg}`);
}

checkStats().catch(console.error);
