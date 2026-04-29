const dbService = require('./dbService');

const DB_CATEGORIES = [
    'politics', 'technology', 'business', 'sports', 'entertainment',
    'health', 'science', 'lifestyle', 'environment', 'world'
];

const CLIENT_TO_DB_MAPPING = {
    'politics': ['politics'],
    'Politics': ['politics'],
    'technology': ['technology'],
    'Technology': ['technology'],
    'business': ['business'],
    'Business': ['business'],
    'sports': ['sports'],
    'Sports': ['sports'],
    'entertainment': ['entertainment'],
    'Entertainment': ['entertainment'],
    'health': ['health'],
    'Health': ['health'],
    'science': ['science'],
    'Science': ['science'],
    'lifestyle': ['lifestyle'],
    'Lifestyle': ['lifestyle'],
    'environment': ['environment'],
    'Environment': ['environment'],
    'world': ['world'],
    'World': ['world'],
    // Legacy mappings
    'World Politics': ['world', 'politics'],
    'US Politics': ['politics'],
    'Technology & AI': ['technology'],
    'Economy & Business': ['business'],
    'Science': ['science'],
    'Health': ['health'],
    'Culture & Society': ['lifestyle', 'entertainment'],
    'Climate & Environment': ['environment'],
    'Crypto & Web3': ['technology'],
    'Current': ['world'],
};
/**
 * Recommendation Service - FULLY DATABASE-BACKED
 *
 * All user data is stored in Supabase and persists across server restarts.
 * User preferences and interaction scores are tied to their account forever.
 */
class RecommendationService {
    constructor() {
        // No in-memory caching - all data comes from database
        // This ensures persistence across server restarts and deployments
    }

    /**
     * Track user interaction with a news item
     * Persists directly to database for permanent storage
     *
     * @param {string} userId - User identifier (Supabase Auth ID or device ID)
     * @param {Object} newsItem - The news item interacted with
     * @param {string} interactionType - 'like', 'view', 'expand', 'swipe_left', 'swipe_right', 'time_spent', etc.
     * @param {Object} metadata - Additional metadata (e.g., { timeSpent: 15 } for seconds)
     */
    async trackInteraction(userId, newsItem, interactionType, metadata = {}) {
        if (!userId || !newsItem?.id) {
            console.warn('[Recommendation] Cannot track: missing userId or newsItem.id');
            return;
        }

        const category = newsItem.category || 'Current';

        // Calculate points based on interaction type
        const points = this._calculatePoints(interactionType, metadata);

        // 1. Record the raw interaction in user_interactions table
        await dbService.recordInteraction(userId, newsItem.id, interactionType, {
            ...metadata,
            category: category,
            points: points
        });

        // 2. Update the aggregated category score in user_category_scores_manual
        // This is a separate table we maintain for fast lookups
        if (points > 0) {
            await this._updateCategoryScore(userId, category, points);
        }

        console.log(`[Recommendation] User ${userId} ${interactionType} on ${category}: +${points} points`);
    }

    /**
     * Calculate points for an interaction type
     */
    _calculatePoints(interactionType, metadata) {
        // Weight different interactions
        // Note: swipe_left/right are opinion actions (agree/disagree) BUT also engagement signals
        const weights = {
            'like': 5,
            'expand': 1,           // Tapping to reveal details
            'question_click': 2,   // Clicking questions shows interest
            'question_ask': 5,     // Asking a question is a HIGH interest signal
            'share_click': 4,      // Sharing is strong engagement signal
            'view': 0,             // Just viewing doesn't indicate preference
            'swipe_left': 3,       // Engagement - even if disagreeing, user cares about topic
            'swipe_right': 3       // Engagement - user cares about topic
        };

        let points = weights[interactionType] || 0;

        // Handle time spent - convert seconds to points
        // Penalize bouncing (< 3s) to learn what users don't like
        if (interactionType === 'time_spent' && metadata.timeSpent) {
            const seconds = Number(metadata.timeSpent) || 0;
            if (seconds < 3) {
                points = -2; // Strong negative signal for skipping
            } else {
                points = Math.min(seconds, 30);
            }
        }

        return points;
    }

    /**
     * Update aggregated category score in database
     * Uses upsert to either create or increment the score
     */
    async _updateCategoryScore(userId, category, pointsToAdd) {
        try {
            await dbService.incrementCategoryScore(userId, category, pointsToAdd);
        } catch (error) {
            console.error('[Recommendation] Failed to update category score:', error.message);
        }
    }

    /**
     * Update manual preferences for a user
     * Preferences are stored permanently in user_preferences table
     *
     * @param {string} userId
     * @param {Object} preferences - { categoryName: weightValue } where weight is 0-3
     *   0 = Hidden/Blocked
     *   1 = Dampened (show less)
     *   2 = Neutral (default)
     *   3 = Boosted (show more)
     */
    async updatePreferences(userId, preferences) {
        if (!userId || !preferences) {
            console.warn('[Recommendation] Cannot update preferences: missing userId or preferences');
            return;
        }

        // Save to database - this persists forever
        await dbService.saveUserPreferences(userId, preferences);

        console.log(`[Recommendation] Saved ${Object.keys(preferences).length} preferences for user ${userId}`);
    }

    /**
     * Get recommended news items for a user
     * Builds recommendations from database-stored preferences and scores
     *
     * @param {string} userId - User identifier
     * @param {number} limit - Number of recommendations
     * @returns {Promise<Array>} - Recommended news items
     */
    async getRecommendations(userId, limit = 50) {
        // 1. Load user data from database
        const [categoryScores, preferences] = await Promise.all([
            dbService.getUserCategoryScores(userId),
            dbService.getUserPreferences(userId)
        ]);

        console.log(`[Recommendation] User ${userId} scores:`, categoryScores);
        console.log(`[Recommendation] User ${userId} preferences:`, preferences);

        // 2. If no user data exists, return diverse feed
        const hasData = Object.keys(categoryScores).length > 0 || Object.keys(preferences).length > 0;
        if (!hasData) {
            console.log(`[Recommendation] No profile for ${userId}, returning diverse feed`);
            return await this.getDiverseFeed(limit);
        }

        // 3. Build weighted category list
        const categoryWeights = this._buildCategoryWeights(categoryScores, preferences);
        console.log(`[Recommendation] Category weights for ${userId}:`, categoryWeights);

        // 4. Determine which categories to exclude
        // Exclude explicitly blocked (weight = 0) AND implicitly disliked (score <= -5)
        // 4. Determine which categories to exclude
        // Exclude explicitly blocked (weight = -1000) AND implicitly disliked (score <= -5)
        // Note: We use categoryWeights here because it already contains the MAPPED scores
        const disabledCategories = Object.entries(categoryWeights)
            .filter(([, score]) => score <= -5)
            .map(([cat]) => cat);

        console.log(`[Recommendation] Disabled categories for ${userId}:`, disabledCategories);

        // 5. Get top categories by weight
        const topCategories = Object.entries(categoryWeights)
            .filter(([cat]) => !disabledCategories.includes(cat))
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([cat]) => cat);

        console.log(`[Recommendation] Top categories for ${userId}:`, topCategories);

        if (topCategories.length === 0) {
            console.log(`[Recommendation] No enabled categories, returning diverse feed`);
            return await this.getDiverseFeed(limit, disabledCategories);
        }

        // 6. Fetch items - 80% from preferred categories, 20% diverse
        const preferredCount = Math.max(Math.floor(limit * 0.8), 1);
        const diverseCount = limit - preferredCount;

        console.log(`[Recommendation] Fetching ${preferredCount} preferred items and ${diverseCount} diverse items`);

        const [preferredItems, diverseItems] = await Promise.all([
            dbService.getItemsByCategories(topCategories, preferredCount),
            this.getDiverseFeed(diverseCount, [...topCategories, ...disabledCategories])
        ]);

        console.log(`[Recommendation] Found ${preferredItems.length} preferred items and ${diverseItems.length} diverse items`);

        // 7. Combine, shuffle, and return
        const combined = [...preferredItems, ...diverseItems];

        if (combined.length === 0) {
            console.log(`[Recommendation] No items found, falling back to standard feed`);
            return await dbService.getReadyFeed(limit, disabledCategories);
        }

        const shuffled = this._shuffleArray(combined).slice(0, limit);
        console.log(`[Recommendation] Returning ${shuffled.length} personalized items for ${userId}`);

        return shuffled;
    }

    /**
     * Build weighted category scores by combining learned scores with manual preferences
     */
    _buildCategoryWeights(categoryScores, preferences) {
        const weights = { ...categoryScores };

        // Apply manual preference boosts/penalties
        // Apply manual preference boosts/penalties with Mapping
        Object.entries(preferences).forEach(([clientKey, weight]) => {
            // Map client category to DB categories (handle synonyms)
            // If no mapping, assume it's a direct match or legacy key
            const targetCategories = CLIENT_TO_DB_MAPPING[clientKey] || [clientKey];

            targetCategories.forEach(dbCategory => {
                const currentScore = weights[dbCategory] || 0;

                switch (weight) {
                    case 0: // Hidden - large negative to exclude
                        weights[dbCategory] = -1000;
                        break;
                    case 1: // Dampened - reduce score
                        weights[dbCategory] = currentScore - 50;
                        break;
                    case 2: // Neutral
                        break;
                    case 3: // Boosted - increase score
                        weights[dbCategory] = currentScore + 100;
                        break;
                }
            });
        });

        return weights;
    }

    /**
     * Get a diverse feed (for new users or to add variety)
     * @param {number} limit - Number of items
     * @param {Array} excludeCategories - Categories to exclude
     * @returns {Promise<Array>} - Diverse news items
     */
    async getDiverseFeed(limit, excludeCategories = []) {
        // All available categories (matching RSS feed categories)
        // All available categories (matching DB categories now)
        const allCategories = DB_CATEGORIES;

        const categories = allCategories.filter(cat => !excludeCategories.includes(cat));

        const items = await dbService.getItemsByCategories(categories, limit);

        // Fallback: if diverse feed returns nothing, get any ready stories
        if (items.length === 0) {
            return await dbService.getReadyFeed(limit, excludeCategories);
        }

        return items;
    }

    /**
     * Get user profile for debugging
     * Returns all stored data for a user
     */
    async getUserProfile(userId) {
        const [categoryScores, preferences] = await Promise.all([
            dbService.getUserCategoryScores(userId),
            dbService.getUserPreferences(userId)
        ]);

        return {
            userId,
            categoryScores,
            preferences,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Hydrate user profile - now just loads from DB
     * Kept for API compatibility but no longer needed for in-memory caching
     */
    async hydrateUserProfile(userId) {
        // No-op - data is always fresh from database
        console.log(`[Recommendation] Profile for ${userId} is always fresh from database`);
    }

    /**
     * Shuffle array (Fisher-Yates algorithm)
     */
    _shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

module.exports = new RecommendationService();
