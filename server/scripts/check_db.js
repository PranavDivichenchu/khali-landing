require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const dbService = require("../services/dbService");

async function check() {
    if (!dbService.supabase) {
        console.error("❌ Supabase not connected.");
        process.exit(1);
    }
    
    // 1. Check News Items status counts
    const { data: newsCounts } = await dbService.supabase
        .from("news_items")
        .select("status");
    
    const counts = {};
    newsCounts.forEach(i => counts[i.status] = (counts[i.status] || 0) + 1);
    console.log("\n📊 [News Items] Status Breakdown:");
    console.table(counts);

    // 2. Check Aggregated Stories status counts (These are what become videos)
    const { data: aggCounts, error } = await dbService.supabase
        .from("aggregated_stories")
        .select("status, title, clipUrl, titleAudioPath");
        
    if (error) {
        console.error("Error fetching aggregated:", error);
    } else {
        const aggStatus = {};
        aggCounts.forEach(i => aggStatus[i.status] = (aggStatus[i.status] || 0) + 1);
        console.log("\n📊 [Aggregated Stories] Status Breakdown:");
        console.table(aggStatus);
        
        // Show details for any READY items
        const ready = aggCounts.filter(i => i.status === "CLIP_READY");
        if (ready.length > 0) {
            console.log(`\n✅ FOUND ${ready.length} READY CLIPS:`);
            ready.forEach(i => console.log(`   - "${i.title.substring(0,30)}..." [Clip: ${i.clipUrl ? "YES" : "NO"}] [Audio: ${i.titleAudioPath ? "YES" : "NO"}]`));
        } else {
            console.log("\n⚠️ NO CLIPS READY YET.");
            // Show what is stuck in AI_PROCESSED
            const ai = aggCounts.filter(i => i.status === "AI_PROCESSED");
            if (ai.length > 0) console.log(`   - ${ai.length} items are done with AI, waiting for Video Search.`);
            
            const vid = aggCounts.filter(i => i.status === "VIDEO_FOUND");
            if (vid.length > 0) console.log(`   - ${vid.length} items have video found, waiting for Download/Clip.`);
        }
    }
    
    // Check if clusters exist
    const { count: clusterCount } = await dbService.supabase.from("event_clusters").select("*", { count: "exact", head: true });
    console.log(`\n📊 Total Clusters: ${clusterCount}`);

    process.exit(0);
}

check();
