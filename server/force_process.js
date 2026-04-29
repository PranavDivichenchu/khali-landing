require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const ingestService = require('./services/ingestService');
const dbService = require('./services/dbService');

async function forceProcess() {
    console.log("🚀 Force-starting AI Processing for pending items...");

    // 0. Force Ingest Fresh News
    console.log("📥 Fetching fresh news from new sources...");
    await ingestService.ingestNews();

    // 1. Cluster first (in case some are waiting)
    await ingestService.clusterNews();

    // 2. Aggregate
    const aggregationService = require('./services/aggregationService');
    await aggregationService.aggregateClusters();

    // 3. Process AI (The most important part for audio)
    // We'll process 10 items to get something ready quickly
    await ingestService.processAggregatedBatch('AGGREGATED', 'ai', 10);

    console.log("✅ Force processing complete (limit 10). Check public/audio.");
    process.exit(0);
}

forceProcess();
