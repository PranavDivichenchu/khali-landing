require('dotenv').config();
const { checkFFmpeg } = require('./utils/ffmpegCheck');
const ingestService = require('./services/ingestService');

async function startWorker() {
    console.log('👷 Starting Video Processing Worker...');

    try {
        // Check FFmpeg installation
        console.log('🔍 Checking system requirements...');
        await checkFFmpeg();

        console.log('\n🚀 Worker Process running!');

        // Start the background ingestion pipeline
        ingestService.startPipeline();

        console.log('✨ Automated news pipeline active in worker process.\n');

        // Keep process alive (node might exit if no active handles, but setInterval in pipeline keeps it alive)
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Worker shutting down...');
            process.exit(0);
        });

    } catch (error) {
        console.error('\n❌ Failed to start worker:');
        console.error(error.message);
        process.exit(1);
    }
}

startWorker();
