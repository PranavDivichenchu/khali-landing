const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

/**
 * GET /api/analytics/dashboard
 * Aggregate stats for the dashboard header
 */
router.get('/dashboard', async (req, res, next) => {
    try {
        const { supabase } = dbService;
        if (!supabase) return res.status(503).json({ error: 'Database not available' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Parallel fetch for stats
        const [
            { count: totalInteractions },
            { count: todayInteractions },
            { count: totalQuestions },
            { count: dayQuestions }
        ] = await Promise.all([
            // Total interactions
            supabase.from('user_interactions').select('*', { count: 'exact', head: true }),
            // Today's interactions
            supabase.from('user_interactions').select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString()),
            // Total questions
            supabase.from('user_questions').select('*', { count: 'exact', head: true }),
            // Today's questions
            supabase.from('user_questions').select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString())
        ]);

        res.json({
            stats: {
                totalInteractions: totalInteractions || 0,
                todayInteractions: todayInteractions || 0,
                totalQuestions: totalQuestions || 0,
                todayQuestions: dayQuestions || 0
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/live-feed
 * Recent user interactions for the ticker
 */
router.get('/live-feed', async (req, res, next) => {
    try {
        const { supabase } = dbService;
        if (!supabase) return res.status(503).json({ error: 'Database not available' });

        // Get recent interactions joined with news title
        // Note: Simple join might not work if foreign key isn't perfect,
        // so we start with interactions and then fetch titles if needed
        // OR rely on metadata having title (if available)

        const { data: interactions, error } = await supabase
            .from('user_interactions')
            .select(`
                id,
                user_id,
                interaction_type,
                created_at,
                metadata,
                news_id
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        // Enrich with titles if possible (manually or via join if view exists)
        // For speed, let's just return what we have, frontend can handle "Unknown Story"
        // But let's try to fetch story titles for these IDs
        if (interactions.length > 0) {
            const newsIds = [...new Set(interactions.map(i => i.news_id))];
            const { data: stories } = await supabase
                .from('aggregated_stories')
                .select('id, title, category')
                .in('id', newsIds);

            const storyMap = {};
            if (stories) {
                stories.forEach(s => storyMap[s.id] = s);
            }

            // Map it
            const feed = interactions.map(i => {
                const story = storyMap[i.news_id] || {};
                return {
                    id: i.id,
                    user: i.user_id.split('-')[0], // Short user ID
                    action: formatAction(i.interaction_type),
                    target: story.title || 'News Story',
                    category: story.category || i.metadata?.category || 'General',
                    time: i.created_at,
                    details: i.metadata // Contains question if type is question_ask
                };
            });
            res.json({ feed });
        } else {
            res.json({ feed: [] });
        }

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/categories
 * Category performance data for charts
 */
router.get('/categories', async (req, res, next) => {
    try {
        const { supabase } = dbService;
        if (!supabase) return res.status(503).json({ error: 'Database not available' });

        // Get aggregated scores from the view or manual table
        // manual table is faster and real-time
        const { data: scores, error } = await supabase
            .from('user_category_scores_manual')
            .select('category, score');

        if (error) throw error;

        // Aggregate by category across all users
        const categoryTotals = {};
        scores.forEach(row => {
            const cat = row.category;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + row.score;
        });

        const chartData = Object.entries(categoryTotals)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);

        res.json({ chartData });

    } catch (error) {
        next(error);
    }
});



/**
 * GET /api/analytics/users
 * List all users with interaction stats
 */
router.get('/users', async (req, res, next) => {
    try {
        const { supabase, supabaseAdmin } = dbService;
        if (!supabase) return res.status(503).json({ error: 'Database not available' });

        // 1. Fetch all interactions and aggregate in memory
        const { data: interactions, error } = await supabase
            .from('user_interactions')
            .select('user_id, created_at, interaction_type')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const userMap = {};

        interactions.forEach(i => {
            const normalizedUserId = i.user_id ? i.user_id.toLowerCase() : 'unknown';

            if (!userMap[normalizedUserId]) {
                userMap[normalizedUserId] = {
                    userId: normalizedUserId,
                    email: null, // Will be populated later
                    interactionCount: 0,
                    lastActive: i.created_at,
                    agrees: 0,
                    disagrees: 0,
                    questions: 0
                };
            }

            const stats = userMap[normalizedUserId];
            stats.interactionCount++;

            if (i.interaction_type === 'swipe_right') stats.agrees++;
            if (i.interaction_type === 'swipe_left') stats.disagrees++;
            if (i.interaction_type === 'question_click') stats.questions++;
        });

        // 2. Fetch user emails from Auth (requires admin client)
        if (supabaseAdmin) {
            try {
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

                if (!authError && authData?.users) {
                    authData.users.forEach(authUser => {
                        if (userMap[authUser.id]) {
                            userMap[authUser.id].email = authUser.email || null;
                        }
                    });
                }
            } catch (authErr) {
                console.warn('[Analytics] Could not fetch auth users:', authErr.message);
            }
        }

        // Convert to array
        const users = Object.values(userMap).sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

        res.json({ users });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/users/:userId
 * Detailed history for a specific user
 */
router.get('/users/:userId', async (req, res, next) => {
    try {
        const { supabase } = dbService;
        const { userId } = req.params;
        if (!supabase) return res.status(503).json({ error: 'Database not available' });

        // Fetch interactions
        const { data: interactions, error } = await supabase
            .from('user_interactions')
            .select(`
                id,
                created_at,
                interaction_type,
                metadata,
                news_id
            `)
            .or(`user_id.eq.${userId.toLowerCase()},user_id.eq.${userId.toUpperCase()}`)
            .order('created_at', { ascending: false })
            .limit(200); // Reasonable limit for history

        if (error) throw error;

        // Fetch user preferences
        const preferences = await dbService.getUserPreferences(userId);

        // Fetch Story details for the interactions
        // Gather unique news IDs
        const newsIds = [...new Set(interactions.map(i => i.news_id))];
        let storyMap = {};

        if (newsIds.length > 0) {
            // 1. Try Aggregated Stories
            const { data: stories } = await supabase
                .from('aggregated_stories')
                .select('id, title, category, summary, clipUrl')
                .in('id', newsIds);

            if (stories) {
                stories.forEach(s => {
                    s.imageURL = s.clipUrl; // Normalize for dashboard
                    storyMap[s.id] = s;
                });
            }

            // 2. Try Standard News Items (for any missing ones)
            const missingIds = newsIds.filter(id => !storyMap[id]);
            if (missingIds.length > 0) {
                const { data: rawItems } = await supabase
                    .from('news_items')
                    .select('id, title, category, summary, imageURL')
                    .in('id', missingIds);

                if (rawItems) {
                    rawItems.forEach(s => storyMap[s.id] = s);
                }
            }
        }

        // Enrich history
        const history = interactions.map(i => {
            const story = storyMap[i.news_id] || { title: 'Unknown Story', category: 'Unknown' };
            // Ensure title is valid
            const title = story.title || 'Untitled Story';

            return {
                id: i.id,
                storyId: i.news_id,
                action: formatAction(i.interaction_type),
                date: i.created_at,
                storyTitle: title,
                storyCategory: story.category,
                storyImage: story.imageURL,
                metadata: i.metadata
            };
        });

        res.json({
            userId,
            preferences,
            summary: {
                totalInteractions: interactions.length,
                firstSeen: interactions.length > 0 ? interactions[interactions.length - 1].created_at : null,
                lastSeen: interactions.length > 0 ? interactions[0].created_at : null
            },
            history
        });
    } catch (error) {
        next(error);
    }
});

function formatAction(type) {
    switch (type) {
        case 'swipe_right': return 'AGREED (Swiped Right)';
        case 'swipe_left': return 'DISAGREED (Swiped Left)';
        case 'question_click': return 'CLICKED QUESTION BUTTON';
        case 'question_ask': return 'ASKED QUESTION';
        case 'share_click': return 'SHARED';
        case 'expand': return 'READ DETAILS';
        case 'time_spent': return 'VIEWED';
        default: return type.toUpperCase();
    }
}

module.exports = router;
