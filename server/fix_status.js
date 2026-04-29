require('dotenv').config();
const dbService = require('./services/dbService');

async function fixStatus() {
    console.log("Fixing status of aggregated stories...");

    // Move CLUSTERING -> AGGREGATED (correct)
    // Move PROCESSING_AI -> AGGREGATED (retry)
    const { data: aggData, error: aggError } = await dbService.supabase
        .from('aggregated_stories')
        .update({
            status: 'AGGREGATED'
        })
        .in('status', ['CLUSTERED', 'PROCESSING_AI'])
        .select('id');

    if (aggError) {
        console.error("❌ Error updating aggregated_stories:", aggError.message);
    } else {
        console.log(`✅ Reset ${aggData.length} aggregated stories to 'AGGREGATED'.`);
    }

    process.exit(0);
}

fixStatus();
