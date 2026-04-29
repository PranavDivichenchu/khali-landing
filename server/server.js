require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { checkFFmpeg } = require('./utils/ffmpegCheck');
const { spawn } = require('child_process');
const errorHandler = require('./middleware/errorHandler');
const clipRoutes = require('./routes/clipRoutes');
const newsRoutes = require('./routes/newsRoutes');

const dbService = require('./services/dbService');

const app = express();
const PORT = process.env.PORT || 3000;
const universalWebBuild = path.join(__dirname, '../universal/dist');
const legacyWebBuild = path.join(__dirname, '../web/dist');

function getWebBuildRoot() {
    if (require('fs').existsSync(path.join(universalWebBuild, 'index.html'))) {
        return universalWebBuild;
    }

    return legacyWebBuild;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
// Serve Web App (prefer the new Expo / React Native Web export when present)
app.use(express.static(getWebBuildRoot()));
app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
// Routes
app.get('/', (req, res) => {
    // Serve React App if built
    const indexPath = path.join(getWebBuildRoot(), 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({
            message: 'Video Clip Server API',
            version: '1.0.0',
            endpoints: {
                clips: {
                    generate: 'POST /api/clips/generate',
                    get: 'GET /api/clips/:filename',
                    metadata: 'GET /api/clips/:clipId/metadata',
                    delete: 'DELETE /api/clips/:clipId'
                },
                news: {
                    feed: 'GET /api/news/feed',
                    item: 'GET /api/news/:newsId'
                }
            }
        });
    }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/clips', clipRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Admin endpoint to regenerate TTS for all posts
app.post('/admin/regenerate-tts', async (req, res) => {
    console.log('🔄 Admin: Starting TTS regeneration for all posts...');

    // Run regeneration in background
    const regenerateProcess = spawn('node', ['scripts/regenerateAllTTS.js'], {
        cwd: __dirname,
        detached: true,
        stdio: 'inherit'
    });

    regenerateProcess.unref(); // Allow parent process to exit independently

    res.json({
        success: true,
        message: 'TTS regeneration started in background',
        pid: regenerateProcess.pid
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        let ingestService = null;

        try {
            ingestService = require('./services/ingestService');
        } catch (error) {
            console.warn('⚠️ Ingestion pipeline unavailable. API will still start without background ingestion.');
            console.warn(`   ${error.message}`);
        }

        // Check FFmpeg installation
        console.log('🔍 Checking system requirements...');
        // Check FFmpeg installation
        console.log('🔍 Checking system requirements...');
        try {
            await checkFFmpeg();
        } catch (err) {
            console.warn('⚠️ FFmpeg not found. Video generation will fail, but Analytics Dashboard will work.');
        }

        // Start Python TTS Service (optional - skip on Railway/production or if SKIP_TTS is set)
        const skipTTS = process.env.SKIP_TTS === 'true' || process.env.RAILWAY_ENVIRONMENT;
        let pythonProcess = null;

        if (skipTTS) {
            console.log('⏭️  Skipping TTS Service (SKIP_TTS or Railway environment detected)');
            console.log('   Audio will use pre-generated files from Supabase storage.');
        } else {
            console.log('🗣️  Starting TTS Service...');
            const pythonPath = process.env.PYTHON_PATH || 'venv/bin/python3';
            console.log(`🐍 Using Python at: ${pythonPath}`);

            const isProduction = process.env.NODE_ENV === 'production';

            if (isProduction) {
                console.log("⚙️ Starting TTS Service with Gunicorn...");
                const gunicornPath = path.join(path.dirname(pythonPath), 'gunicorn');
                pythonProcess = spawn(gunicornPath, ['--bind', '0.0.0.0:5001', '--workers', '1', 'tts_service:app']);
            } else {
                pythonProcess = spawn(pythonPath, ['tts_service.py']);
            }

            pythonProcess.on('error', (err) => {
                console.error(`❌ Failed to start TTS Service (Python): ${err.message}`);
                console.warn('⚠️ Server will continue without TTS functionality.');
            });

            pythonProcess.stdout.on('data', (data) => {
                console.log(`[TTS Service] ${data.toString().trim()}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                const output = data.toString().trim();
                // Refined log handling
                const isAccessLog = output.includes(' - - [') && (output.includes('" 200 -') || output.includes('" 500 -'));
                const isStartupInfo = output.includes('Starting gunicorn') || output.includes('Listening at:') || output.includes('Booting worker');
                const isDevWarning = output.includes('WARNING: This is a development server');

                if (isAccessLog || isStartupInfo || isDevWarning) {
                    console.log(`[TTS Service] ${output}`);
                } else {
                    console.error(`[TTS Service Error] ${output}`);
                }
            });
        }

        // Handle clean exit
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping servers...');
            if (pythonProcess) pythonProcess.kill();
            process.exit();
        });

        // Start listening
        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n🚀 Video Clip Server running!');
            console.log(`📍 Server: http://localhost:${PORT}`);
            console.log(`📁 Clips directory: ${process.env.CLIPS_DIR}`);
            console.log(`📥 Downloads directory: ${process.env.DOWNLOADS_DIR}`);

            // Start the continuous ingestion pipeline
            if (ingestService?.startPipeline) {
                ingestService.startPipeline();
            }
        });

    } catch (error) {
        console.error('\n❌ Failed to start server:');
        console.error(error.message);
        console.error('\nPlease ensure FFmpeg is installed:');
        console.error('  macOS: brew install ffmpeg');
        console.error('  Ubuntu: sudo apt-get install ffmpeg');
        console.error('  Windows: Download from https://ffmpeg.org/download.html\n');
        process.exit(1);
    }
}

startServer();
