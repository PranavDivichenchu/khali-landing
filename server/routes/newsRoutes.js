const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

/**
 * GET /api/news/feed
 * Get news feed with clip URLs from SQLite database
 */
router.get('/feed', async (req, res, next) => {
    try {
        console.log('📡 Serving feed from database...');
        const feedItems = await dbService.getReadyFeed(50);

        // Enrich with clip URLs if they are relative (fallback for old clips)
        const enrichedItems = feedItems.map(item => {
            if (item.clipUrl && !item.clipUrl.startsWith('http')) {
                item.clipUrl = `${process.env.BASE_URL}${item.clipUrl}`;
            }
            if (item.titleAudioPath && !item.titleAudioPath.startsWith('http')) {
                item.titleAudioPath = `${process.env.BASE_URL}${item.titleAudioPath}`;
            }
            if (item.descriptionAudioPath && !item.descriptionAudioPath.startsWith('http')) {
                item.descriptionAudioPath = `${process.env.BASE_URL}${item.descriptionAudioPath}`;
            }
            if (item.podcast_audio_path && !item.podcast_audio_path.startsWith('http')) {
                item.podcast_audio_path = `${process.env.BASE_URL}${item.podcast_audio_path}`;
            }
            return item;
        });

        res.json({ data: enrichedItems });

    } catch (error) {
        console.error('Error fetching feed from DB:', error);
        next(error);
    }
});

/**
 * GET /api/news/status
 * Get the status of the background ingestion pipeline
 */
router.get('/status', async (req, res, next) => {
    try {
        const [
            ingested,
            ai_processed,
            video_found,
            clip_ready,
            failed_video
        ] = await Promise.all([
            dbService.getPendingItems('INGESTED', 1000).then(items => items.length),
            dbService.getPendingItems('AI_PROCESSED', 1000).then(items => items.length),
            dbService.getPendingItems('VIDEO_FOUND', 1000).then(items => items.length),
            dbService.getReadyFeed(1000).then(items => items.length),
            dbService.getPendingItems('FAILED_NO_VIDEO', 1000).then(items => items.length)
        ]);

        const stats = {
            ingested,
            ai_processed,
            video_found,
            clip_ready,
            failed_video
        };
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/news/optimize
 * KEEP for manual triggers if needed, but refactored for DB
 */
router.post('/optimize', async (req, res, next) => {
    try {
        const aiService = require('../services/aiService');
        const items = await dbService.getPendingItems('INGESTED', 10);

        console.log(`✨ Manually optimizing batch of ${items.length} items...`);

        for (const item of items) {
            const optimized = await aiService.optimizeArticle(item);
            await dbService.updateItem(item.id, {
                title: optimized.title,
                summary: optimized.summary,
                leftPerspective: optimized.leftPerspective,
                rightPerspective: optimized.rightPerspective,
                claims: optimized.claims,
                isOptimized: 1,
                status: 'AI_PROCESSED'
            });
        }

        res.json({ message: 'Manual optimization complete', count: items.length });

    } catch (error) {
        console.error('Error optimizing feed:', error);
        next(error);
    }
});

/**
 * POST /api/news/refresh
 * Trigger a new ingestion round
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const ingestService = require('../services/ingestService');
        console.log('🔄 Manually triggering news refresh...');

        // Run in background
        ingestService.runPipeline();

        res.json({ message: 'Ingestion round started in background' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/news/recommendations/:userId
 * Get personalized recommendations for a user
 */
router.get('/recommendations/:userId', async (req, res, next) => {
    try {
        const recommendationService = require('../services/recommendationService');
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const recommendations = await recommendationService.getRecommendations(userId, limit);

        res.json({
            data: recommendations,
            userId: userId,
            count: recommendations.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/news/track
 * Track user interaction with news item (Legacy Single)
 * Body: { userId, newsItem, interactionType, metadata? }
 */
router.post('/track', async (req, res, next) => {
    try {
        const recommendationService = require('../services/recommendationService');
        const { userId, newsItem, interactionType, metadata } = req.body;

        if (!userId || !newsItem || !interactionType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await recommendationService.trackInteraction(userId, newsItem, interactionType, metadata || {});

        // Record vote if interaction is a swipe
        if (interactionType === 'swipe_left' || interactionType === 'swipe_right') {
            const vote = interactionType === 'swipe_right' ? 'agree' : 'disagree';
            await dbService.recordVote(userId, newsItem.id, vote);
        }

        res.json({ success: true, message: 'Interaction tracked' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/news/track/batch
 * Track batch of user interactions (TikTok-style)
 * Body: [ { userId, newsItem, interactionType, ... }, ... ]
 */
router.post('/track/batch', async (req, res, next) => {
    try {
        const recommendationService = require('../services/recommendationService');
        const events = req.body;

        if (!Array.isArray(events)) {
            return res.status(400).json({ error: 'Body must be an array of events' });
        }

        console.log(`📦 Processing batch of ${events.length} metrics events...`);

        // Process all events in parallel
        await Promise.all(events.map(async (event) => {
            const { userId, newsItem, interactionType, metadata } = event;

            if (!userId || !newsItem || !interactionType) return;

            // Track in recommendation engine (await for database persistence)
            await recommendationService.trackInteraction(userId, newsItem, interactionType, metadata || {});

            // Persist votes if applicable
            if (interactionType === 'swipe_left' || interactionType === 'swipe_right') {
                const vote = interactionType === 'swipe_right' ? 'agree' : 'disagree';
                await dbService.recordVote(userId, newsItem.id, vote).catch(err =>
                    console.error(`   Failed to record vote for ${newsItem.id}:`, err.message)
                );
            }
        }));

        res.json({
            success: true,
            message: `Processed ${events.length} events`,
            count: events.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/news/vote
 * Record user vote for a story
 * Body: { userId, storyId, vote }
 */
router.post('/vote', async (req, res, next) => {
    try {
        const { userId, storyId, vote } = req.body;

        if (!userId || !storyId || !vote) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await dbService.recordVote(userId, storyId, vote);

        if (result.error) {
            return res.status(500).json({ error: result.error.message });
        }

        res.json({
            success: true,
            message: 'Vote recorded',
            stats: result.data
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/news/preferences
 * Update user category preferences
 * Body: { userId, preferences }
 */
router.post('/preferences', async (req, res, next) => {
    try {
        const recommendationService = require('../services/recommendationService');
        const { userId, preferences } = req.body;

        if (!userId || !preferences) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await recommendationService.updatePreferences(userId, preferences);

        res.json({
            success: true,
            message: 'Preferences updated'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/news/preferences/:userId
 * Get user category preferences
 */
router.get('/preferences/:userId', async (req, res, next) => {
    try {
        const dbService = require('../services/dbService');
        const { userId } = req.params;

        const preferences = await dbService.getUserPreferences(userId);

        res.json(preferences);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/news/learned-weights/:userId
 * Get AI-learned effective weights for display in settings
 * Returns normalized weights (0-3) based on learned behavior + manual preferences
 */
router.get('/learned-weights/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const dbService = require('../services/dbService');

        // Get learned scores and manual preferences
        const [categoryScores, preferences] = await Promise.all([
            dbService.getUserCategoryScores(userId),
            dbService.getUserPreferences(userId)
        ]);

        // Define all categories
        const allCategories = [
            'politics', 'technology', 'business', 'sports', 'entertainment',
            'health', 'science', 'lifestyle', 'environment', 'world'
        ];

        // Build learned weights for each category
        const learnedWeights = {};

        for (const category of allCategories) {
            const learnedScore = categoryScores[category] || 0;
            const manualWeight = preferences[category];

            // If manually set to 0 (hidden), keep it at 0
            if (manualWeight === 0) {
                learnedWeights[category] = 0;
                continue;
            }

            // Normalize learned score to 0-3 scale
            // Scores typically range from -100 to +200
            // Negative = Off (0), 0-50 = Low (1), 50-150 = Med (2), 150+ = High (3)
            let normalizedWeight;
            if (learnedScore < 0) {
                normalizedWeight = 0;
            } else if (learnedScore < 50) {
                normalizedWeight = 1;
            } else if (learnedScore < 150) {
                normalizedWeight = 2;
            } else {
                normalizedWeight = 3;
            }

            // If user has manual preference, blend it (manual takes precedence)
            if (manualWeight !== undefined && manualWeight !== 2) {
                // Manual preference exists and is not neutral
                // Weight manual more heavily: 70% manual, 30% learned
                normalizedWeight = Math.round(manualWeight * 0.7 + normalizedWeight * 0.3);
            }

            learnedWeights[category] = Math.max(0, Math.min(3, normalizedWeight));
        }

        res.json({
            userId,
            learnedWeights,
            rawScores: categoryScores,
            manualPreferences: preferences
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/news/profile/:userId
 * Get user profile for debugging
 */
router.get('/profile/:userId', async (req, res, next) => {
    try {
        const recommendationService = require('../services/recommendationService');
        const { userId } = req.params;

        // Force hydration if missing to show real state
        await recommendationService.hydrateUserProfile(userId);

        const profile = await recommendationService.getUserProfile(userId);

        res.json({
            userId: userId,
            profile: profile || { message: 'No profile found' }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/news/tts
 * Generate speech from text
 * Body: { text }
 */
router.post('/tts', async (req, res, next) => {
    try {
        const aiService = require('../services/aiService');
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Missing text' });
        }

        const audioBuffer = await aiService.generateSpeech(text);

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });

        res.send(audioBuffer);

    } catch (error) {
        console.error('Error in /tts endpoint:', error);
        next(error);
    }
});

router.post('/qa', async (req, res, next) => {
    try {
        const aiService = require('../services/aiService');
        const { newsId, question, userId } = req.body;
        const normalizedQuestion = typeof question === 'string' ? question.trim() : '';

        if (!newsId || !normalizedQuestion || !userId) {
            return res.status(400).json({ error: 'Missing newsId, question, or userId' });
        }

        // 1. Return cached answer only when the same question is asked again.
        const existingQA = await dbService.getUserQuestion(userId, newsId);
        const isSameQuestion = typeof existingQA?.question === 'string'
            && existingQA.question.trim().toLowerCase() === normalizedQuestion.toLowerCase();
        if (existingQA && isSameQuestion) {
            console.log(`ℹ️ User ${userId} repeated question for post ${newsId}. Returning cached answer.`);
            return res.json({
                answer: existingQA.answer,
                alreadyAsked: true,
                originalQuestion: existingQA.question
            });
        }

        // 2. Fetch the item context
        const item = await dbService.getItem(newsId);
        if (!item) {
            return res.status(404).json({ error: 'News item not found' });
        }

        // 3. Generate answer from AI
        const answer = await aiService.answerQuestion(normalizedQuestion, item);

        // 4. Track the question and answer in Supabase
        await dbService.saveUserQuestion(userId, newsId, normalizedQuestion, answer);

        // 5. Track interaction for recommendation engine (High weighted signal)
        const recommendationService = require('../services/recommendationService'); // Ensure loaded
        await recommendationService.trackInteraction(userId, item, 'question_ask', { question: normalizedQuestion });

        res.json({ answer });

    } catch (error) {
        console.error('Error in /qa endpoint:', error);
        next(error);
    }
});

module.exports = router;
