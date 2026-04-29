require('dotenv').config();
const dbService = require('./services/dbService');

async function checkStatus() {
    if (!dbService.supabase) {
        console.log("No Supabase");
        return;
    }

    // Check News Items
    const { data: news, error } = await dbService.supabase
        .from('news_items')
        .select('id, title, status, descriptionAudioPath')
        .in('status', ['AI_PROCESSED', 'CLUSTERED', 'PROCESSING_AI'])
        .limit(10);

    console.log("--- Standard News Items ---");
    if (news) {
        news.forEach(n => console.log(`[${n.status}] ${n.title.substring(0, 30)}... | Audio: ${n.descriptionAudioPath ? 'YES' : 'NO'} (${n.descriptionAudioPath})`));
    } else {
        console.log("Error:", error);
    }

    // Check Aggregated Stories
    const { data: agg, error: aggError } = await dbService.supabase
        .from('aggregated_stories')
        .select('id, title, status, descriptionAudioPath')
        .in('status', ['AI_PROCESSED', 'CLUSTERED', 'PROCESSING_AI'])
        .limit(10);

    console.log("\n--- Aggregated Stories ---");
    if (agg) {
        agg.forEach(n => console.log(`[${n.status}] ${n.title.substring(0, 30)}... | Audio: ${n.descriptionAudioPath ? 'YES' : 'NO'} (${n.descriptionAudioPath})`));
    } else {
        console.log("Error:", aggError);
    }
}

checkStatus();
