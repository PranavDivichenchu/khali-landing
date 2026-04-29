require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const dbService = require("../services/dbService");

async function reprocessAll() {
    if (!dbService.supabase) {
        console.error("❌ Supabase not connected.");
        process.exit(1);
    }
    
    console.log("🟠 Resetting ALL aggregated stories (Attempt 2 - Fixed Columns)...");

    // Remove isOptimized from update if it does not exist on this table
    const { error: aggError, count: aggCount } = await dbService.supabase
        .from("aggregated_stories")
        .update({ 
            status: "AGGREGATED",
            titleAudioPath: null,
            descriptionAudioPath: null
        })
        .neq("status", "AGGREGATED"); 

    if (aggError) console.error("Error resetting aggregated:", aggError);
    else console.log(`✅ Reset aggregated stories to AGGREGATED status.`);

    setTimeout(() => {
        console.log("🚀 Done.");
        process.exit(0);
    }, 1000);
}

reprocessAll();
