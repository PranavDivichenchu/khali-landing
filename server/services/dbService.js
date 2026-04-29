require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class DBService {
    constructor() {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.error('❌ Supabase credentials missing in .env');
            // Allow app to start even if config is missing, but methods will fail
            this.supabase = null;
            this.supabaseAdmin = null;
        } else {
            this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized');

            // Admin client for auth operations (requires SERVICE_ROLE_KEY)
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                this.supabaseAdmin = createClient(
                    process.env.SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY,
                    { auth: { autoRefreshToken: false, persistSession: false } }
                );
                console.log('✅ Supabase admin client initialized (for auth access)');
            } else {
                this.supabaseAdmin = null;
                console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set - user emails will not be available');
            }
        }
    }

    /**
     * Insert or ignore a news item (upsert)
     */
    async saveNewsItem(item) {
        if (!this.supabase) return { error: 'Supabase not initialized' };

        const { data, error } = await this.supabase
            .from('news_items')
            .upsert({
                id: item.id,
                title: item.title,
                summary: item.summary, // Pass array/object directly (Supabase handles JSONB)
                imageURL: item.imageURL,
                sourceAPI: item.sourceAPI,
                date: item.date,
                category: item.category || 'Current',
                status: item.status || 'INGESTED',
                articleURL: item.articleURL,
                articleURL: item.articleURL,
                claims: item.claims || [],
                sample_question: item.sampleQuestion,
                audio_script: item.audioScript || item.audio_script
            }, { onConflict: 'id', ignoreDuplicates: true })
            .select();

        if (error) {
            console.error('Error saving news item:', error.message);
        }
        return { data, error, changes: data ? data.length : 0 };
    }

    /**
     * Get items that need processing for a specific stage
     */
    /**
     * Get pending items for specific stage
     * @deprecated Use fetchAndLockItems for concurrency
     */
    async getPendingItems(status, limit = 5) {
        if (!this.supabase) return [];

        const { data, error } = await this.supabase
            .from('news_items')
            .select('*')
            .eq('status', status)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error(`Error fetching pending items for ${status}:`, error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Atomically fetch and lock items for processing
     * This simulates "SELECT FOR UPDATE SKIP LOCKED" by trying to update candidates.
     */
    async fetchAndLockItems(table, status, processingStatus, limit = 5) {
        if (!this.supabase) return [];

        // 1. Fetch candidates (over-fetch slightly to increase odds of locking enough items)
        const fetchLimit = limit * 2;
        const { data: candidates, error: fetchError } = await this.supabase
            .from(table)
            .select('id')
            .eq('status', status)
            .order('date', { ascending: false })
            .limit(fetchLimit);

        if (fetchError || !candidates || candidates.length === 0) return [];

        const lockedItems = [];

        // 2. Try to lock them one by one (or in small batches)
        // We do this to ensure we only return items WE successfully updated.
        for (const candidate of candidates) {
            if (lockedItems.length >= limit) break;

            const { data, error } = await this.supabase
                .from(table)
                .update({ status: processingStatus, updatedAt: new Date().toISOString() })
                .eq('id', candidate.id)
                .eq('status', status) // Optimistic lock: ensure it's still in original status
                .select()
                .single();

            if (!error && data) {
                lockedItems.push(data);
            }
        }

        return lockedItems;
    }

    /**
     * Update an item's status and any other fields
     */
    async updateItem(id, updates) {
        if (!this.supabase) return { error: 'Supabase not initialized' };

        // Add updatedAt timestamp
        const payload = { ...updates, updatedAt: new Date().toISOString() };

        // Map sampleQuestion to sample_question if present
        if (updates.sampleQuestion) {
            payload.sample_question = updates.sampleQuestion;
            delete payload.sampleQuestion;
        }

        if (updates.audioScript) {
            payload.audio_script = updates.audioScript;
            delete payload.audioScript;
        }

        // Map videoCredits to video_credits
        if (updates.videoCredits) {
            payload.video_credits = updates.videoCredits;
            delete payload.videoCredits;
        }

        const { data, error } = await this.supabase
            .from('news_items')
            .update(payload)
            .eq('id', id)
            .select();

        if (error) {
            console.error(`Error updating item ${id}:`, error.message);
        }
        return { data, error };
    }

    /**
     * Batch update multiple items at once (more efficient than sequential updates)
     */
    async batchUpdateItems(updates) {
        if (!this.supabase || !updates || updates.length === 0) return { success: true };

        console.log(`[DB] Batch updating ${updates.length} items...`);

        // Prepare all payloads with proper field mapping
        const payloads = updates.map(({ id, data }) => {
            const payload = { id, ...data, updatedAt: new Date().toISOString() };

            // Map field names
            if (data.sampleQuestion) {
                payload.sample_question = data.sampleQuestion;
                delete payload.sampleQuestion;
            }
            if (data.audioScript) {
                payload.audio_script = data.audioScript;
                delete payload.audioScript;
            }
            if (data.videoCredits) {
                payload.video_credits = data.videoCredits;
                delete payload.videoCredits;
            }

            return payload;
        });

        // Use upsert for batch update
        const { data, error } = await this.supabase
            .from('news_items')
            .upsert(payloads, { onConflict: 'id' })
            .select();

        if (error) {
            console.error(`[DB] Batch update error:`, error.message);
            return { error };
        }

        console.log(`[DB] ✅ Batch updated ${data?.length || 0} items`);
        return { data, success: true };
    }

    /**
     * Increment article count in a cluster and update timestamp
     */
    async incrementClusterArticleCount(clusterId) {
        if (!this.supabase) return;

        // Current count + 1
        const { data: cluster } = await this.supabase
            .from('event_clusters')
            .select('article_count')
            .eq('id', clusterId)
            .single();

        const currentCount = cluster ? cluster.article_count : 0;

        await this.supabase
            .from('event_clusters')
            .update({
                article_count: currentCount + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', clusterId);
    }

    /**
     * Search for similar clusters using vector similarity
     */
    async matchClusters(embedding, threshold = 0.55, hours = 48) {
        if (!this.supabase) return [];

        const { data, error } = await this.supabase.rpc('match_clusters', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: 5,
            time_window_hours: hours
        });

        if (error) {
            console.error('[DB] Error matching clusters:', error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Update an aggregated story's status and fields
     */
    async updateAggregatedStory(id, updates) {
        if (!this.supabase) return { error: 'Supabase not initialized' };

        const payload = { ...updates, updatedAt: new Date().toISOString() };

        if (updates.audioScript) {
            payload.audio_script = updates.audioScript;
            delete payload.audioScript;
        }

        // Map videoCredits to video_credits
        if (updates.videoCredits) {
            payload.video_credits = updates.videoCredits;
            delete payload.videoCredits;
        }

        const { data, error } = await this.supabase
            .from('aggregated_stories')
            .update(payload)
            .eq('id', id)
            .select();

        if (error) {
            console.error(`Error updating aggregated story ${id}:`, error.message);
        }
        return { data, error };
    }

    /**
     * Batch update multiple aggregated stories at once
     */
    async batchUpdateAggregatedStories(updates) {
        if (!this.supabase || !updates || updates.length === 0) return { success: true };

        console.log(`[DB] Batch updating ${updates.length} aggregated stories...`);

        const payloads = updates.map(({ id, data }) => {
            const payload = { id, ...data, updatedAt: new Date().toISOString() };

            if (data.audioScript) {
                payload.audio_script = data.audioScript;
                delete payload.audioScript;
            }
            if (data.videoCredits) {
                payload.video_credits = data.videoCredits;
                delete payload.videoCredits;
            }

            return payload;
        });

        const { data, error } = await this.supabase
            .from('aggregated_stories')
            .upsert(payloads, { onConflict: 'id' })
            .select();

        if (error) {
            console.error(`[DB] Batch update aggregated stories error:`, error.message);
            return { error };
        }

        console.log(`[DB] ✅ Batch updated ${data?.length || 0} aggregated stories`);
        return { data, success: true };
    }

    /**
     * Get pending aggregated stories for processing
     */
    async getPendingAggregatedStories(status, limit = 5) {
        if (!this.supabase) return [];

        const { data, error } = await this.supabase
            .from('aggregated_stories')
            .select('*')
            .eq('status', status)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error(`Error fetching pending aggregated stories for ${status}:`, error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Get items ready for the feed with vote counts
     */
    async getReadyFeed(limit = 50, excludeCategories = []) {
        // Fallback data in case DB is down
        const fallbackFeed = [
            {
                id: 'fallback-1',
                title: 'System Update: Offline Mode',
                summary: ['Unable to connect to the cloud database.', 'Showing cached content instead.', 'Please check your internet connection.'],
                imageURL: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
                category: 'System',
                date: new Date().toISOString(),
                isAggregated: true,
                isOptimized: true,
                clipDuration: 0,
                agreeCount: 0,
                disagreeCount: 0,
                sources: [{ sourceAPI: 'System', iconURL: null }]
            }
        ];

        if (!this.supabase) return fallbackFeed;

        try {
            // Create a timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('DB Request Timed Out')), 5000)
            );

            // 1. Fetch aggregated clips along with vote stats
            // We use standardized categories for priority logic
            const mainCategories = ['politics', 'technology', 'business', 'health', 'science', 'environment', 'world', 'lifestyle']
                .filter(cat => !excludeCategories.includes(cat));
            
            const mixCategories = ['sports', 'entertainment']
                .filter(cat => !excludeCategories.includes(cat));

            if (mainCategories.length === 0 && mixCategories.length === 0) {
                console.log('⚠️ All categories excluded, returning empty feed candidates');
                return [];
            }

            let mainQuery = this.supabase
                .from('aggregated_stories')
                .select(`*, story_vote_stats(agree_count, disagree_count)`)
                .eq('status', 'CLIP_READY')
                .order('date', { ascending: false })
                .limit(limit);

            if (mainCategories.length > 0) {
                mainQuery = mainQuery.in('category', mainCategories);
            } else {
                mainQuery = mainQuery.eq('category', 'non-existent-category');
            }

            let mixQuery = this.supabase
                .from('aggregated_stories')
                .select(`*, story_vote_stats(agree_count, disagree_count)`)
                .eq('status', 'CLIP_READY')
                .order('date', { ascending: false })
                .limit(Math.max(5, Math.floor(limit * 0.3))); // ~30% mix

            if (mixCategories.length > 0) {
                mixQuery = mixQuery.in('category', mixCategories);
            } else {
                mixQuery = mixQuery.eq('category', 'non-existent-category');
            }

            // Race against timeout
            const [mainRes, mixRes] = await Promise.all([
                Promise.race([mainQuery, timeout]),
                Promise.race([mixQuery, timeout])
            ]);

            if (mainRes.error) console.error('Error fetching main feed:', mainRes.error.message);
            if (mixRes.error) console.error('Error fetching mix feed:', mixRes.error.message);

            const mainItems = mainRes.data || [];
            const mixItems = mixRes.data || [];

            // Interleave items: 2 Main, 1 Mix, 2 Main, 1 Mix...
            const mixedFeed = [];
            let i = 0, j = 0;

            while (i < mainItems.length || j < mixItems.length) {
                // Add up to 2 main items
                if (i < mainItems.length) mixedFeed.push(mainItems[i++]);
                if (i < mainItems.length) mixedFeed.push(mainItems[i++]);

                // Add 1 mix item
                if (j < mixItems.length) mixedFeed.push(mixItems[j++]);
            }

            if (mixedFeed.length === 0) return [];

            return mixedFeed.map(item => this._mapAggregatedStory(item));

        } catch (err) {
            console.error('CRITICAL: DB Connection Failed:', err.message);
            return fallbackFeed;
        }
    }

    _mapAggregatedStory(item) {
        // Flatten vote stats if present
        let voteStats = { agree_count: 0, disagree_count: 0 };
        if (item.story_vote_stats) {
            if (Array.isArray(item.story_vote_stats) && item.story_vote_stats.length > 0) {
                voteStats = item.story_vote_stats[0];
            } else if (!Array.isArray(item.story_vote_stats)) {
                voteStats = item.story_vote_stats;
            }
        }

        return {
            ...item,
            isAggregated: true,
            isOptimized: true,
            // Use the first source's image as the background
            imageURL: (item.sources && item.sources.length > 0) ? item.sources[0].iconURL : null,
            summary: item.summary,
            leftPerspective: item.leftPerspective,
            rightPerspective: item.rightPerspective,
            // Ensure claims is always an array, fallback to claim if claims missing
            claims: (item.claims && item.claims.length > 0) ? item.claims : (item.claim ? [item.claim] : []),
            agreeCount: voteStats.agree_count || 0,
            disagreeCount: voteStats.disagree_count || 0,
            videoCredits: item.video_credits // explicit map for clarity
        };
    }

    /**
     * Get enabled RSS feeds
     */
    async getEnabledFeeds() {
        if (!this.supabase) return [];

        const { data, error } = await this.supabase
            .from('rss_feeds')
            .select('*')
            .eq('enabled', true);

        if (error) {
            console.error('Error fetching RSS feeds:', error.message);
            return [];
        }
        return data || [];
    }

    /**
     * Clean up old items
     */
    async cleanupOldItems(days = 7) {
        if (!this.supabase) return;

        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);

        const { error } = await this.supabase
            .from('news_items')
            .delete()
            .lt('date', dateThreshold.toISOString());

        if (error) {
            console.error('Error cleaning up old items:', error.message);
        }
    }

    /**
     * Get items by categories for recommendations
     */
    async getItemsByCategories(categories, limit = 10) {
        if (!this.supabase) return [];

        // Fetch aggregated items ONLY for recommendations with vote stats
        const { data: aggData, error: aggError } = await this.supabase
            .from('aggregated_stories')
            .select(`
                *,
                story_vote_stats (
                    agree_count,
                    disagree_count
                )
            `)
            .in('category', categories)
            .eq('status', 'CLIP_READY')
            .order('date', { ascending: false })
            .limit(limit);

        if (aggError) {
            console.error('Error in recommendations (aggregated):', aggError.message);

            // Fallback if view is missing
            if (aggError.message.includes('story_vote_stats')) {
                const { data: fallbackData } = await this.supabase
                    .from('aggregated_stories')
                    .select('*')
                    .in('category', categories)
                    .eq('status', 'CLIP_READY')
                    .order('date', { ascending: false })
                    .limit(limit);
                return (fallbackData || []).map(item => this._mapAggregatedStory(item));
            }
        }

        // Map and return only aggregated stories
        return (aggData || []).map(item => this._mapAggregatedStory(item));
    }

    /**
     * Record a user interaction for analytics
     */
    async recordInteraction(userId, newsId, type, metadata = {}) {
        if (!this.supabase) return;

        // Fire and forget - don't await to avoid slowing down response
        this.supabase
            .from('user_interactions')
            .insert({
                user_id: userId,
                news_id: newsId,
                interaction_type: type,
                metadata: metadata
            })
            .then(({ error }) => {
                if (error) console.error('[Analytics] Error recording interaction:', error.message);
            });
    }

    /**
     * Get user category scores from both the analytics view AND manual scores table
     * Combines scores from both sources for comprehensive recommendations
     */
    async getUserCategoryScores(userId) {
        if (!this.supabase) return {};

        const combinedScores = {};

        // 1. Try to get scores from the analytics view (computed from user_interactions)
        try {
            const { data: viewData, error: viewError } = await this.supabase
                .from('user_category_scores')
                .select('category, score')
                .eq('user_id', userId);

            if (!viewError && viewData) {
                viewData.forEach(row => {
                    combinedScores[row.category] = (combinedScores[row.category] || 0) + row.score;
                });
            }
        } catch (e) {
            // View might not exist - that's OK
        }

        // 2. Also get manually tracked scores (incremented in real-time)
        try {
            const { data: manualData, error: manualError } = await this.supabase
                .from('user_category_scores_manual')
                .select('category, score')
                .eq('user_id', userId);

            if (!manualError && manualData) {
                manualData.forEach(row => {
                    combinedScores[row.category] = (combinedScores[row.category] || 0) + row.score;
                });
            }
        } catch (e) {
            // Table might not exist yet
        }

        return combinedScores;
    }

    /**
     * Increment a user's category score
     * Uses upsert to create or add to existing score
     */
    async incrementCategoryScore(userId, category, points) {
        if (!this.supabase || points === 0) return;

        try {
            // First try to get existing score
            const { data: existing } = await this.supabase
                .from('user_category_scores_manual')
                .select('score')
                .eq('user_id', userId)
                .eq('category', category)
                .single();

            const currentScore = existing?.score || 0;
            const newScore = currentScore + points;

            // Upsert the new score
            const { error } = await this.supabase
                .from('user_category_scores_manual')
                .upsert({
                    user_id: userId,
                    category: category,
                    score: newScore,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,category' });

            if (error) {
                console.error('[DB] Error incrementing category score:', error.message);
            } else {
                console.log(`[DB] Updated score for ${userId}/${category}: ${currentScore} -> ${newScore}`);
            }
        } catch (error) {
            console.error('[DB] incrementCategoryScore failed:', error.message);
        }
    }

    /**
     * Record a user vote
     */
    async recordVote(userId, storyId, vote) {
        if (!this.supabase) return { error: 'Supabase not initialized' };

        console.log(`🗳️ Recording vote for user ${userId} on story ${storyId}: ${vote}`);

        // 1. Record the vote
        const { error: upsertError } = await this.supabase
            .from('user_votes')
            .upsert({
                user_id: userId,
                story_id: storyId,
                vote: vote,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id,story_id' });

        if (upsertError) {
            console.error('Error recording vote:', upsertError.message);
            return { error: upsertError };
        }

        // 2. Fetch updated stats
        const { data: stats, error: statsError } = await this.supabase
            .from('story_vote_stats')
            .select('agree_count, disagree_count')
            .eq('story_id', storyId)
            .single();

        if (statsError) {
            console.error('Error fetching vote stats:', statsError.message);
            // Return success but with zeroed stats if fetch fails (fallback)
            return { data: { agree_count: 0, disagree_count: 0 } };
        }

        return { data: stats };
    }

    /**
     * Save user preferences (category weights)
     */
    async saveUserPreferences(userId, preferences) {
        if (!this.supabase) return { error: 'Supabase not initialized' };

        console.log(`💾 Saving ${Object.keys(preferences).length} preferences for user ${userId}`);

        // Transform object { "Tech": 3 } into array of updates
        const upserts = Object.entries(preferences).map(([category, weight]) => ({
            user_id: userId,
            category: category,
            weight: weight,
            updated_at: new Date().toISOString()
        }));

        if (upserts.length === 0) return { success: true };

        const { error } = await this.supabase
            .from('user_preferences')
            .upsert(upserts, { onConflict: 'user_id, category' });

        if (error) {
            console.error('Error saving preferences:', error.message);
            return { error };
        }

        return { success: true };
    }

    /**
     * Get user preferences - returns stored values only
     */
    async getUserPreferences(userId) {
        if (!this.supabase) return {};

        const { data, error } = await this.supabase
            .from('user_preferences')
            .select('category, weight')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching preferences:', error.message);
            return {};
        }

        // Convert array to object { "politics": 2, "sports": 0, etc. }
        return (data || []).reduce((acc, row) => {
            acc[row.category] = row.weight;
            return acc;
        }, {});
    }
    /**
     * Get a single news item by ID
     */
    async getItem(id) {
        if (!this.supabase) return null;

        // 1. Try news_items
        const { data: newsItem, error: newsError } = await this.supabase
            .from('news_items')
            .select('*')
            .eq('id', id)
            .single();

        if (!newsError && newsItem) return newsItem;

        // 2. Try aggregated_stories
        const { data: aggItem, error: aggError } = await this.supabase
            .from('aggregated_stories')
            .select('*')
            .eq('id', id)
            .single();

        if (!aggError && aggItem) {
            // Fetch all news items in this cluster for richer context
            let clusterContext = [];
            if (aggItem.cluster_id) {
                const { data: newsItems } = await this.supabase
                    .from('news_items')
                    .select('summary')
                    .eq('cluster_id', aggItem.cluster_id);

                if (newsItems) {
                    clusterContext = newsItems.flatMap(ni => Array.isArray(ni.summary) ? ni.summary : [ni.summary]);
                }
            }

            // Map common fields to match expectation of answerQuestion
            return {
                ...aggItem,
                // Combine aggregated summary with all summaries from individual articles in the cluster
                summary: [...(aggItem.summary || []), ...clusterContext],
                claims: aggItem.claim ? [aggItem.claim] : (aggItem.claims || [])
            };
        }

        if (newsError && aggError) {
            console.error(`Error fetching item ${id} from both tables:`, newsError.message, aggError.message);
        }

        return null;
    }

    /**
     * Save a user question and AI answer
     */
    async saveUserQuestion(userId, postId, question, answer) {
        if (!this.supabase) return { error: 'Supabase not initialized' };

        console.log(`💾 Saving question for user ${userId} on post ${postId}`);

        const { data, error } = await this.supabase
            .from('user_questions')
            .upsert({
                user_id: userId,
                post_id: postId,
                question: question,
                answer: answer,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id,post_id' })
            .select()
            .single();

        if (error) {
            console.error('Error saving user question:', error.message);
        }
        return { data, error };
    }

    /**
     * Get a user's question and answer for a post
     */
    async getUserQuestion(userId, postId) {
        if (!this.supabase) return null;

        const { data, error } = await this.supabase
            .from('user_questions')
            .select('*')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error('Error fetching user question:', error.message);
        }

        return data;
    }
}

module.exports = new DBService();
