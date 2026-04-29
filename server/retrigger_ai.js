require('dotenv').config();
const dbService = require('./services/dbService');

async function retriggerAIProcessing() {
    if (!dbService.supabase) {
        console.error("❌ Supabase connection not available.");
        return;
    }

    console.log("🔄 Resetting 'AI_PROCESSED' items to 'CLUSTERED' to re-trigger AI Podcast Generation...");

    // 1. Reset News Items from ANY advanced state
    const { data: newsData, error: newsError } = await dbService.supabase
        .from('news_items')
        .update({
            status: 'CLUSTERED',
            isOptimized: false,
            audio_script: null,
            descriptionAudioPath: null
        })
        .in('status', ['PROCESSING_AI', 'AI_PROCESSED', 'VIDEO_FOUND', 'CLIP_READY', 'COMPLETED']) // Retrigger EVERYTHING
        .select('id');

    if (newsError) {
        console.error("❌ Error updating news_items:", newsError.message);
    } else {
        console.log(`✅ Reset ${newsData.length} news items.`);
    }

    // 2. Reset Aggregated Stories from ANY advanced state
    const { data: aggData, error: aggError } = await dbService.supabase
        .from('aggregated_stories')
        .update({
            status: 'CLUSTERED',
            audio_script: null,
            descriptionAudioPath: null
        })
        .in('status', ['PROCESSING_AI', 'AI_PROCESSED', 'VIDEO_FOUND', 'CLIP_READY', 'COMPLETED']) // Retrigger EVERYTHING
        .select('id');

    if (aggError) {
        console.error("❌ Error updating aggregated_stories:", aggError.message);
    } else {
        console.log(`✅ Reset ${aggData.length} aggregated stories.`);
    }

    console.log("\n🚀 The Ingest Service will now pick these up automatically shortly.");
    process.exit(0);
}

retriggerAIProcessing();
