const dbService = require('./services/dbService');
const eventClusteringService = require('./services/eventClusteringService');
const aggregationService = require('./services/aggregationService');

async function verify() {
    console.log('🔍 Starting Verification...');

    // 1. Check DB Connection
    if (!dbService.supabase) {
        console.error('❌ Supabase client NOT initialized');
        return;
    }
    console.log('✅ Supabase client initialized');

    // 2. Test Aggregator Query
    try {
        const readyClusters = await aggregationService._getReadyClusters();
        console.log(`✅ Aggregator query returned ${readyClusters.length} clusters`);
    } catch (err) {
        console.error('❌ Aggregator query failed:', err.message);
    }

    // 3. Test Vector Search RPC
    try {
        const mockEmbedding = Array(1536).fill(0);
        const matches = await dbService.matchClusters(mockEmbedding);
        if (matches && matches.length > 0) {
            console.log('✅ Vector search RPC (match_clusters) is working');
        } else {
            console.log('⚠️ Vector search RPC (match_clusters) returned no matches. This is normal if the DB is empty or SQL not run.');
        }
    } catch (err) {
        console.log('❌ Vector search RPC failed significantly:', err.message);
    }

    console.log('🏁 Verification script complete.');
}

verify();
