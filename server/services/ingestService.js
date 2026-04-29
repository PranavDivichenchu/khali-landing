const https = require('https');
const fs = require('fs');
const path = require('path');
const dbService = require('./dbService');
const aiService = require('./aiService');
const stockVideoService = require('./stockVideoService');
const eventClusteringService = require('./eventClusteringService');
const aggregationService = require('./aggregationService');
const limitService = require('./limitService');
const rssService = require('./rssService');

const newsMeshService = require('./newsMeshService');

class IngestService {
    constructor() {
        if (!process.env.NEWS_API_KEYS) {
            throw new Error('NEWS_API_KEYS environment variable is required');
        }
        this.apiKeys = process.env.NEWS_API_KEYS.split(',');
        this.currentKeyIndex = 0;
        this.isProcessing = false;
        this.processedInThisRound = 0;
        this.lastIngestTime = 0;
        this.lastCleanupTime = 0;
    }

    get currentKey() {
        return this.apiKeys[this.currentKeyIndex] || this.apiKeys[0];
    }

    rotateKey() {
        console.log(`⚠️ API Key Limit Reached. Rotating key...`);
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        console.log(`🔄 Switched to API Key #${this.currentKeyIndex + 1}`);
    }

    /**
     * Start the automated pipeline
     */
    async startPipeline() {
        console.log('🚀 NEWS PIPELINE: Initializing continuous mode...');

        // Initial run after a small delay
        setTimeout(() => this.loopPipeline(), 2000);
    }

    async loopPipeline() {
        await this.runPipeline();

        // If we processed items, loop immediately (with small breath).
        // If idle, wait longer.
        const delay = (this.processedInThisRound > 0) ? 1000 : 10 * 1000;

        // Debug log only if we actually did something, to reduce noise
        if (this.processedInThisRound > 0) {
            console.log(`   [Loop] Processed items, restarting pipeline in ${delay / 1000}s...`);
        }

        setTimeout(() => this.loopPipeline(), delay);
    }

    async runPipeline() {
        if (this.isProcessing) {
            // Silently return to avoid "Pipeline busy" spasm
            return;
        }

        this.isProcessing = true;
        this.processedInThisRound = 0;

        try {
            const now = Date.now();
            const INGEST_INTERVAL = 10 * 60 * 1000; // 10 mins

            // 1. Fetch new items from news API (infrequent)
            if (now - this.lastIngestTime > INGEST_INTERVAL) {
                console.log('\n--- 🌪️ [Pipeline] Starting New News Ingestion ---');
                await this.ingestNews();
                this.lastIngestTime = now;
            }

            // 2. Cluster new items
            await this.clusterNews();

            // 3. Aggregate clusters with 2+ sources
            await aggregationService.aggregateClusters();

            // 4. Process Aggregated Stories (AI -> Stock Video)
            // Increased batch sizes for constant processing
            // Reduced batch sizes for memory efficiency on Railway (OOM prevention)
            await this.processAggregatedBatch('AGGREGATED', 'ai', 2);
            await this.processBatch('CLUSTERED', 'ai', 2);
            // Note: 'youtube' and 'clip' stages are removed as they are now handled immediately in 'ai' stage
            // via stock video search. The status jumps directly to CLIP_READY.

            // 5. Maintenance: Prune bad news articles and clean up disk (once an hour)
            const CLEANUP_INTERVAL = 60 * 60 * 1000;
            if (now - this.lastCleanupTime > CLEANUP_INTERVAL) {
                console.log('🧹 [Maintenance] Pruning stale data and cleaning disk...');

                // Database cleanup
                if (dbService.supabase) {
                    await dbService.supabase.from('news_items')
                        .delete()
                        .is('cluster_id', null)
                        .lt('date', new Date(now - 24 * 60 * 60 * 1000).toISOString());
                }

                // Disk cleanup: temporary scripts and audio files
                await this.performDiskCleanup();

                this.lastCleanupTime = now;
            }

            if (this.processedInThisRound > 0) {
                // Keep this log, it's useful for "Heartbeat" when things are happening
                console.log(`--- [Pipeline] Round Complete. Processed ${this.processedInThisRound} actions. ---\n`);
            }
        } catch (error) {
            console.error('❌ Pipeline Error:', error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Fetch news from RSS Feeds and save to DB
     */
    async ingestFromNewsMesh() {
        console.log('[Ingestor] 🌐 Fetching latest from NewsMesh API...');
        const categories = ['politics', 'technology', 'business', 'health', 'science', 'environment', 'world', 'lifestyle', 'sports', 'entertainment'];

        // Track success per category to determine if we can skip RSS
        const results = {};
        categories.forEach(cat => results[cat] = false);

        for (const cat of categories) {
            try {
                const response = await newsMeshService.getLatest(cat, 10); // 10 per category per run

                if (response.status === 'RATE_LIMIT') {
                    console.warn(`   [NewsMesh] ⚠️ Rate limit reached for ${cat}. Will fallback to RSS.`);
                    // We mark as false so RSS fallback happens
                    continue;
                }

                if (response.status === 'ERROR') {
                    console.warn(`   [NewsMesh] ⚠️ API Error for ${cat}. Will fallback to RSS.`);
                    continue;
                }

                const articles = response.items || [];
                console.log(`   [NewsMesh] Fetched ${articles.length} items for category: ${cat}`);

                if (articles.length === 0) {
                    console.log(`   [NewsMesh] No items returned for ${cat}. Fallback to RSS.`);
                    continue;
                }

                let savedCount = 0;
                for (const item of articles) {
                    const result = await dbService.saveNewsItem(item);
                    if (result.changes > 0) savedCount++;
                }

                console.log(`   [NewsMesh] ${cat}: Ingested ${savedCount} new items.`);

                // Mark success only if we actually got items (or call was successful)
                results[cat] = true;

            } catch (err) {
                console.error(`   [NewsMesh Error] ${cat}:`, err.message);
            }
        }

        return results;
    }

    /**
     * Fetch news from RSS Feeds and save to DB
     */
    async ingestNews() {
        const DAILY_LIMIT = 333; // 10k per month / 30 days

        // 1. Check if we are under the daily limit
        const underLimit = await limitService.checkLimit('newsmesh', DAILY_LIMIT);

        if (underLimit) {
            // 2. Fetch from NewsMesh (API)
            console.log('[Ingestor] ✅ Under daily limit, using NewsMesh API...');
            const results = await this.ingestFromNewsMesh();

            // Count successful API calls (one per category)
            const successfulCalls = Object.values(results).filter(v => v === true).length;
            if (successfulCalls > 0) {
                await limitService.incrementUsage('newsmesh', successfulCalls);
            }

            // Check if any category hit rate limit
            const anyRateLimited = Object.values(results).some(v => v === false);
            if (anyRateLimited) {
                console.log('[Ingestor] ⚠️ Some categories hit API rate limit. Supplementing with RSS...');
                await this.ingestFromRSS();
            }
        } else {
            // 3. Limit reached - use RSS fallback
            console.log('[Ingestor] ⚠️ Daily NewsMesh limit reached (333 calls). Using RSS fallback...');
            await this.ingestFromRSS();
        }
    }

    /**
     * Fallback: Fetch news from RSS feeds
     */
    async ingestFromRSS() {
        console.log('[Ingestor] 📡 Fetching news from RSS feeds...');

        const feeds = await dbService.getEnabledFeeds();
        if (!feeds || feeds.length === 0) {
            console.log('[Ingestor] No enabled RSS feeds found in database.');
            return;
        }

        console.log(`[Ingestor] Found ${feeds.length} enabled RSS feeds.`);

        let totalIngested = 0;

        for (const feed of feeds) {
            try {
                const items = await rssService.fetchFeed(feed.url, feed.name);

                // Skip if error object returned
                if (items.error) {
                    console.log(`   [RSS] Skipping ${feed.name} due to ${items.statusCode || 'error'}`);
                    continue;
                }

                if (!items || items.length === 0) continue;

                let savedCount = 0;
                for (const item of items) {
                    // Map RSS item to our news_items schema
                    const newsItem = {
                        id: require('uuid').v4(),
                        title: item.title,
                        summary: [item.content || ''],
                        imageURL: item.imageUrl || null,
                        articleURL: item.link,
                        sourceAPI: `RSS - ${item.source || feed.name}`,
                        category: this._mapCategory(feed.category) || 'world',
                        date: item.pubDate ? item.pubDate.toISOString() : new Date().toISOString(),
                        status: 'INGESTED',
                        createdAt: new Date().toISOString()
                    };

                    const result = await dbService.saveNewsItem(newsItem);
                    if (result.changes > 0) savedCount++;
                }

                if (savedCount > 0) {
                    console.log(`   [RSS] ${feed.name}: Ingested ${savedCount} new items.`);
                    totalIngested += savedCount;
                }
            } catch (err) {
                console.error(`   [RSS Error] ${feed.name}:`, err.message);
            }
        }

        console.log(`[Ingestor] RSS Ingestion complete. Total new items: ${totalIngested}`);
    }

    /**
     * Map feed category to standardized category
     */
    _mapCategory(rawCategory) {
        if (!rawCategory) return 'world';
        const cat = rawCategory.toLowerCase();
        const allowed = ['politics', 'technology', 'business', 'sports', 'entertainment', 'health', 'science', 'lifestyle', 'environment', 'world'];
        if (allowed.includes(cat)) return cat;
        return 'world';
    }

    /**
     * Map items to clusters
     */
    /**
     * Map items to clusters
     */
    async clusterNews() {
        // Use locking to safely process in parallel workers
        const items = await dbService.fetchAndLockItems('news_items', 'INGESTED', 'PROCESSING_CLUSTERING', 10);
        if (items.length === 0) return;

        console.log(`[Pipeline] Clustering ${items.length} news items...`);

        // Process in parallel
        await Promise.all(items.map(async (item) => {
            try {
                const clusterId = await eventClusteringService.identifyCluster(item);
                if (clusterId) {
                    await dbService.updateItem(item.id, {
                        cluster_id: clusterId,
                        status: 'CLUSTERED'
                    });
                    await dbService.incrementClusterArticleCount(clusterId);
                } else {
                    // If no cluster found, mark as CLUSTERED anyway (new single cluster logic?)
                    // or just leave it. The original logic simulated finding a cluster.
                    // Assuming if identifyCluster returns null it means "no match found yet" or error.
                    // To prevent infinite loop, we should probably set it to something or leave it as PROCESSING?
                    // Original code didn't handle null well (was likely "create new").
                    // Let's assume for now if strict null, we revert to INGESTED or mark IGNORED.
                    // But to be safe and avoid stuck "PROCESSING" items:
                    await dbService.updateItem(item.id, { status: 'CLUSTERED' }); // Fallback to progress
                }
            } catch (err) {
                console.error(`   Error clustering item ${item.id}:`, err.message);
                // Revert to INGESTED or mark FAILED so it picks up again?
                // Better to mark FAILED_CLUSTERING to avoid infinite retry loops in dev
                await dbService.updateItem(item.id, { status: 'FAILED_CLUSTERING' });
            }
        }));
    }

    /**
     * Process a batch of items for a specific stage
     */
    async processBatch(status, stage, limit = 5) {
        const PROCESSING_STATUS = `PROCESSING_${stage.toUpperCase()}`;
        // Use locking
        const items = await dbService.fetchAndLockItems('news_items', status, PROCESSING_STATUS, limit);
        if (items.length === 0) return;

        console.log(`[Pipeline] Processing ${items.length} items for stage: ${stage.toUpperCase()}`);

        // Collect all updates for batch processing
        const batchUpdates = [];
        const audioUploads = [];
        const results = [];

        // Process SEQUENTIALLY to save memory on Railway
        for (const item of items) {
            try {
                if (stage === 'ai') {
                    let optimized;
                    try {
                        optimized = await aiService.optimizeArticle(item);
                    } catch (aiErr) {
                        console.error(`   [AI Error] Failed to optimize ${item.id}:`, aiErr.message);
                        await dbService.updateItem(item.id, { status: 'FAILED_AI_OPTIMIZE' });
                        results.push(0);
                        continue;
                    }

                    // Skip if content was filtered out as inappropriate
                    if (optimized === null) {
                        await dbService.updateItem(item.id, { status: 'FILTERED_INAPPROPRIATE' });
                        console.log(`   Filtered inappropriate content: ${item.id}`);
                        results.push(1);
                        continue;
                    }

                    let titleAudioPath = null;
                    let descriptionAudioPath = null;

                    // ... (rest of TTS logic is mostly same, but make sure to await inner asyncs) ...
                    // Since the original code had a massive block here, I'll try to preserve it but wrap in try/catch safely

                    let podcastAudioPath = null;
                    let captions = null;

                    try {
                        let descAudio;
                        let podcastResult;

                        // Check if we have a Podcast Dialogue (Array) or Legacy Script (String)
                        // If it's a string that looks like JSON, parse it
                        let dialogue = optimized.podcastDialogue;
                        if (!dialogue && optimized.audioScript && optimized.audioScript.trim().startsWith('[')) {
                            try { dialogue = JSON.parse(optimized.audioScript); } catch (e) { }
                        }

                        if (dialogue && Array.isArray(dialogue)) {
                            // NEW: Generate Podcast
                            console.log(`[Ingestor] 🎙️ Generating Podcast for item: ${item.title}`);
                            podcastResult = await aiService.generatePodcast(dialogue);

                            // Read the actual audio file from the path returned
                            if (podcastResult && podcastResult.audioPath && fs.existsSync(podcastResult.audioPath)) {
                                descAudio = fs.readFileSync(podcastResult.audioPath);
                                captions = podcastResult.captions || null;
                                console.log(`[Ingestor] ✅ Podcast generated with ${captions?.length || 0} caption segments`);
                            } else {
                                console.error(`[Ingestor] ❌ Podcast audio file not found at ${podcastResult?.audioPath}`);
                                throw new Error('Podcast audio file not found');
                            }
                        } else {
                            // FALLBACK: Legacy Monologue
                            let descText = optimized.audioScript || optimized.summary.join(". ");
                            descAudio = await aiService.generateSpeech(descText);
                        }

                        const descFilename = `${item.id}_desc.mp3`;
                        const tempDescPath = path.join(__dirname, '../public/audio', descFilename);

                        const publicAudioDir = path.dirname(tempDescPath);
                        if (!fs.existsSync(publicAudioDir)) fs.mkdirSync(publicAudioDir, { recursive: true });
                        fs.writeFileSync(tempDescPath, descAudio);

                        // Collect audio upload for parallel batch processing
                        audioUploads.push({
                            itemId: item.id,
                            filename: descFilename,
                            audio: descAudio,
                            tempPath: tempDescPath,
                            isDialogue: !!dialogue
                        });

                        // Temporarily use local path (will be replaced after batch upload)
                        let publicDescUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/audio/${descFilename}`;
                        descriptionAudioPath = publicDescUrl;
                        podcastAudioPath = dialogue ? publicDescUrl : null;

                        // Clean up temp podcast file if it exists
                        if (podcastResult?.audioPath && fs.existsSync(podcastResult.audioPath)) {
                            fs.unlinkSync(podcastResult.audioPath);
                        }
                    } catch (ttsErr) {
                        console.error(`   [TTS Error] for ${item.id}:`, ttsErr.message);
                    }

                    // --- BACKGROUND MEDIA LOOKUP ---
                    let clipUrl = null;
                    let videoCredits = null;
                    let clipStatus = 'AI_PROCESSED'; // Default if fail

                    try {
                        // PRIORITY 1: Use the article's own image from the news source
                        // This is almost always the most relevant visual for the story
                        if (item.imageURL && item.imageURL.startsWith('http')) {
                            clipUrl = item.imageURL;
                            clipStatus = 'CLIP_READY';
                            console.log(`[Ingestor] 🖼️ Using article image as background: ${clipUrl.substring(0, 80)}...`);
                        } else {
                            // PRIORITY 2: Fall back to Pexels stock video only if no article image
                            const keywords = optimized.visualContext?.keywords || "";
                            const altKeywords = optimized.visualContext?.keywordsAlt || null;
                            const category = optimized.category;
                            console.log(`[Ingestor] 🎬 No article image. Searching Stock Video for "${item.title}"...`);

                            const vidResult = await stockVideoService.searchVideo(keywords, category, altKeywords);

                            if (vidResult && vidResult.link) {
                                clipUrl = vidResult.link;
                                videoCredits = vidResult.credits;
                                clipStatus = 'CLIP_READY';
                                console.log(`[Ingestor] ✅ Stock Video Found: ${clipUrl}`);
                            } else {
                                console.log(`[Ingestor] ⚠️ No stock video found. Leaving clipUrl null.`);
                                clipStatus = 'CLIP_READY';
                            }
                        }
                    } catch (vidErr) {
                        console.error(`   [Stock Video Error] ${vidErr.message}`);
                        clipStatus = 'CLIP_READY'; // Proceed without video
                    }

                    // Collect update for batch processing
                    batchUpdates.push({
                        id: item.id,
                        data: {
                            title: optimized.title,
                            summary: optimized.summary,
                            category: optimized.category,
                            leftPerspective: optimized.leftPerspective,
                            rightPerspective: optimized.rightPerspective,
                            claims: optimized.claims,
                            sample_question: optimized.sampleQuestion,
                            audio_script: optimized.audioScript,
                            podcastAudioPath: podcastAudioPath,
                            caption_data: captions,
                            isOptimized: 1,
                            status: clipStatus,
                            clipUrl: clipUrl,
                            clipDuration: 60
                        }
                    });
                }
                results.push(1);
            } catch (err) {
                console.error(`   Error processing item ${item.id} in ${stage}:`, err.message);
                // Mark as failed immediately (don't batch failures for faster retry)
                await dbService.updateItem(item.id, { status: `FAILED_${stage.toUpperCase()}` });
                results.push(0);
            }
        }

        // BATCH OPERATIONS: Upload all audio files in parallel
        if (audioUploads.length > 0 && dbService.supabase) {
            console.log(`[Pipeline] Uploading ${audioUploads.length} audio files in parallel...`);
            await Promise.all(audioUploads.map(async ({ itemId, filename, audio, tempPath, isDialogue }) => {
                try {
                    // Sanity check
                    if (audio.length < 500) {
                        const textContent = audio.toString();
                        if (textContent.startsWith('{') || textContent.includes('"error"')) {
                            console.error(`[Ingestor] ❌ Skipping invalid audio for ${itemId}`);
                            return;
                        }
                    }

                    const { error } = await dbService.supabase.storage
                        .from('clips')
                        .upload(filename, audio, { contentType: 'audio/mpeg', upsert: true });

                    if (!error) {
                        const publicUrl = dbService.supabase.storage.from('clips').getPublicUrl(filename).data.publicUrl;

                        // Update the batch update with Supabase URL
                        const updateIndex = batchUpdates.findIndex(u => u.id === itemId);
                        if (updateIndex !== -1) {
                            batchUpdates[updateIndex].data.podcastAudioPath = isDialogue ? publicUrl : batchUpdates[updateIndex].data.podcastAudioPath;
                        }
                    }

                    // Clean up temp file
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                } catch (err) {
                    console.error(`[Ingestor] ⚠️ Audio upload failed for ${itemId}:`, err.message);
                }
            }));
            console.log(`[Pipeline] ✅ Batch audio upload complete`);
        }

        // BATCH OPERATIONS: Update all items at once
        if (batchUpdates.length > 0) {
            await dbService.batchUpdateItems(batchUpdates);
        }

        this.processedInThisRound += results.filter(r => r === 1).length;
    }

    /**
     * Process a batch of aggregated stories
     */
    /**
     * Process a batch of aggregated stories
     */
    async processAggregatedBatch(status, stage, limit = 5) {
        if (!dbService.supabase) return;

        const PROCESSING_STATUS = `PROCESSING_${stage.toUpperCase()}`;
        const items = await dbService.fetchAndLockItems('aggregated_stories', status, PROCESSING_STATUS, limit);
        if (items.length === 0) return;

        console.log(`[Pipeline] Processing ${items.length} aggregated stories for stage: ${stage.toUpperCase()}`);

        const results = [];
        for (const item of items) {
            try {
                if (stage === 'ai') {
                    // Consolidate everything into a single "Paragraph Script" (audio_script)
                    let dialogue = null;
                    let descText = null;
                    let captions = null;

                    // Check if we have a Podcast Dialogue (Array) or Legacy Script (String)
                    if (item.audio_script && item.audio_script.trim().startsWith('[')) {
                        try {
                            const parsed = JSON.parse(item.audio_script);
                            if (Array.isArray(parsed)) dialogue = parsed;
                        } catch (e) {
                            console.warn(`[Ingestor] Failed to parse audio_script JSON for aggregated story ${item.id}`);
                        }
                    }

                    let descAudio;
                    let podcastResult;
                    if (dialogue) {
                        console.log(`[Ingestor] 🎙️ Generating Podcast for aggregated story: ${item.title}`);
                        podcastResult = await aiService.generatePodcast(dialogue);

                        // Read the actual audio file from the path returned
                        if (podcastResult && podcastResult.audioPath && fs.existsSync(podcastResult.audioPath)) {
                            descAudio = fs.readFileSync(podcastResult.audioPath);
                            captions = podcastResult.captions || null;
                            console.log(`[Ingestor] ✅ Aggregated podcast generated with ${captions?.length || 0} caption segments`);
                        } else {
                            console.error(`[Ingestor] ❌ Aggregated podcast audio file not found at ${podcastResult?.audioPath}`);
                            throw new Error('Podcast audio file not found');
                        }
                    } else {
                        descText = item.audio_script || item.summary.join(". ");
                        descAudio = await aiService.generateSpeech(descText);
                    }

                    const descFilename = `agg_${item.id}_desc.mp3`;

                    let descUrl = null;
                    if (dbService.supabase) {
                        // SANITY CHECK: Ensure we are not uploading JSON by mistake
                        if (descAudio.length < 500) {
                            try {
                                const textContent = descAudio.toString();
                                if (textContent.startsWith('{') || textContent.includes('"error"')) {
                                    console.error(`[Ingestor] ❌ ABORTING AGG UPLOAD: Audio buffer appears to be JSON error:`, textContent);
                                    throw new Error("Invalid aggregated audio buffer");
                                }
                            } catch (e) { }
                        }
                        const { error: err } = await dbService.supabase.storage.from('clips').upload(descFilename, descAudio, { contentType: 'audio/mpeg', upsert: true });
                        if (!err) {
                            descUrl = dbService.supabase.storage.from('clips').getPublicUrl(descFilename).data.publicUrl;
                            console.log(`[Ingestor] ✅ Uploaded aggregated audio to Supabase: ${descUrl}`);
                        } else {
                            console.error(`[Ingestor] ⚠️ Aggregated audio Supabase upload error:`, err);
                        }
                    }

                    // FALLBACK: Use local URL
                    if (!descUrl) {
                        descUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/audio/${descFilename}`;
                        const tempDescPath = path.join(__dirname, '../public/audio', descFilename);
                        const publicAudioDir = path.dirname(tempDescPath);
                        if (!fs.existsSync(publicAudioDir)) fs.mkdirSync(publicAudioDir, { recursive: true });
                        if (!fs.existsSync(tempDescPath)) fs.writeFileSync(tempDescPath, descAudio);
                    }

                    // Clean up temp podcast file if it exists
                    if (podcastResult?.audioPath && fs.existsSync(podcastResult.audioPath)) {
                        fs.unlinkSync(podcastResult.audioPath);
                    }

                    // --- BACKGROUND MEDIA LOOKUP (Aggregated) ---
                    let clipUrl = null;
                    let videoCredits = null;
                    let clipStatus = 'AI_PROCESSED';

                    try {
                        // PRIORITY 1: Use the article's own image from the news source
                        if (item.imageURL && item.imageURL.startsWith('http')) {
                            clipUrl = item.imageURL;
                            clipStatus = 'CLIP_READY';
                            console.log(`[Ingestor] 🖼️ Using article image for aggregated story: ${clipUrl.substring(0, 80)}...`);
                        } else {
                            // PRIORITY 2: Fall back to Pexels stock video
                            const aggKeywords = item.title;
                            const category = item.category;
                            const altKeywords = item.visualContext?.keywordsAlt || null;
                            console.log(`[Ingestor] 🎬 No article image. Searching Stock Video for Aggregated Story "${item.title}"...`);

                            const vidResult = await stockVideoService.searchVideo(aggKeywords, category, altKeywords);

                            if (vidResult && vidResult.link) {
                                clipUrl = vidResult.link;
                                videoCredits = vidResult.credits;
                                clipStatus = 'CLIP_READY';
                            } else {
                                clipStatus = 'CLIP_READY';
                            }
                        }
                    } catch (vidErr) {
                        console.error(`   [Stock Video Error] ${vidErr.message}`);
                        clipStatus = 'CLIP_READY';
                    }

                    await dbService.updateAggregatedStory(item.id, {
                        podcast_audio_path: descUrl,
                        podcast_captions: captions,
                        status: clipStatus,
                        clipUrl: clipUrl,
                        clipDuration: 60
                    });
                }
                results.push(1);
            } catch (err) {
                console.error(`   Error processing aggregated story ${item.id} in ${stage}:`, err.message);
                await dbService.updateAggregatedStory(item.id, { status: `FAILED_${stage.toUpperCase()}` });
                results.push(0);
            }
        }
        this.processedInThisRound += results.filter(r => r === 1).length;

    }

    async performDiskCleanup() {
        try {
            const serverRoot = path.join(__dirname, '..');
            const files = fs.readdirSync(serverRoot);

            // 1. Clean up stale player scripts (*-player-script.js)
            const playerScripts = files.filter(f => f.endsWith('-player-script.js'));
            playerScripts.forEach(f => {
                const filePath = path.join(serverRoot, f);
                const stats = fs.statSync(filePath);
                const ageMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60);

                // If older than 1 hour, delete
                if (ageMinutes > 60) {
                    fs.unlinkSync(filePath);
                    console.log(`   [Cleanup] Deleted stale script: ${f}`);
                }
            });

            // 2. Clean up temp directory
            const tempDir = path.join(serverRoot, 'temp');
            if (fs.existsSync(tempDir)) {
                const tempFiles = fs.readdirSync(tempDir);
                tempFiles.forEach(f => {
                    const filePath = path.join(tempDir, f);
                    const stats = fs.statSync(filePath);
                    const ageMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60);

                    if (ageMinutes > 60) {
                        if (fs.statSync(filePath).isDirectory()) {
                            fs.rmSync(filePath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(filePath);
                        }
                    }
                });
            }

            // 3. Clean up root temp_*.aiff files
            const rootTempFiles = files.filter(f => f.startsWith('temp_') && (f.endsWith('.aiff') || f.endsWith('.mp3')));
            rootTempFiles.forEach(f => {
                const filePath = path.join(serverRoot, f);
                const stats = fs.statSync(filePath);
                if ((Date.now() - stats.mtimeMs) / (1000 * 60) > 60) {
                    fs.unlinkSync(filePath);
                    console.log(`   [Cleanup] Deleted root temp file: ${f}`);
                }
            });

        } catch (err) {
            console.error('[Cleanup] Disk maintenance error:', err.message);
        }
    }


}

module.exports = new IngestService();
