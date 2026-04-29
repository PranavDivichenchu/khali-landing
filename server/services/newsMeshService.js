const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class NewsMeshService {
    constructor() {
        this.apiKey = process.env.NEWSMESH_API_KEY;
        if (!this.apiKey) {
            console.warn('⚠️ NEWSMESH_API_KEY not set. NewsMesh features will be disabled.');
        }
        this.baseUrl = 'https://api.newsmesh.co/v1';
    }

    /**
     * Search for articles
     * @param {Object} params - Search parameters
     * @param {string} params.q - Search query
     * @param {string} [params.from] - Published after (YYYY-MM-DD)
     * @param {string} [params.to] - Published before (YYYY-MM-DD)
     * @param {number} [params.limit] - Limit results (max 25)
     * @param {string} [params.language] - Language code (e.g. 'en')
     */
    async searchArticles({ q, from, to, limit = 25, language = 'en' }) {
        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    apiKey: this.apiKey,
                    q,
                    from,
                    to,
                    limit,
                    language
                }
            });

            return this._normalizeResponse(response.data);
        } catch (error) {
            console.error('[NewsMesh] Search failed:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Get latest articles by category
     * @param {string} category - Category (e.g. 'politics')
     * @param {number} limit - Limit results
     */
    async getLatest(category, limit = 25) {
        if (!this.apiKey) {
            return { status: 'ERROR', items: [] };
        }
        try {
            const response = await axios.get(`${this.baseUrl}/latest`, {
                params: {
                    apiKey: this.apiKey,
                    category,
                    limit,
                    country: 'us' // Focus on US news for now as per previous context
                }
            });

            return {
                status: 'OK',
                items: this._normalizeResponse(response.data)
            };
        } catch (error) {
            const status = error.response?.status === 429 ? 'RATE_LIMIT' : 'ERROR';
            console.error(`[NewsMesh] Get Latest (${category}) failed:`, status, error.message);
            return { status, items: [] };
        }
    }

    /**
     * Normalize NewsMesh response to our internal news item format
     */
    /**
     * Normalize NewsMesh response to our internal news item format
     */
    _normalizeResponse(data) {
        if (!data || !data.data) return [];

        return data.data.map(article => ({
            id: uuidv4(), // Generate internal ID
            title: article.title,
            summary: [article.description || article.content || ''],
            imageURL: article.image_url || article.media_url || null,
            articleURL: article.url || article.link,
            sourceAPI: `NewsMesh - ${article.source_id || article.source || 'Unknown'}`,
            category: this._mapToStandardCategory(article.category ? article.category[0] : 'general'),
            date: article.pubDate || article.published_date || new Date().toISOString(),
            status: 'INGESTED',
            createdAt: new Date().toISOString()
        }));
    }

    _mapToStandardCategory(rawCategory) {
        if (!rawCategory) return 'world'; // Default fallback

        const cat = rawCategory.toLowerCase();

        // Direct matches (allowed list)
        // politics, technology, business, sports, entertainment, health, science, lifestyle, environment, world
        if (['politics', 'technology', 'business', 'sports', 'entertainment', 'health', 'science', 'lifestyle', 'environment', 'world'].includes(cat)) {
            return cat;
        }

        // Mappings
        if (cat.includes('tech') || cat.includes('ai') || cat.includes('crypto') || cat.includes('software')) return 'technology';
        if (cat.includes('financ') || cat.includes('market') || cat.includes('econ')) return 'business';
        if (cat.includes('us') || cat.includes('congress') || cat.includes('senate') || cat.includes('elect')) return 'politics';
        if (cat.includes('film') || cat.includes('music') || cat.includes('celeb') || cat.includes('movie')) return 'entertainment';
        if (cat.includes('climate') || cat.includes('green') || cat.includes('planet')) return 'environment';
        if (cat.includes('medic') || cat.includes('wellness') || cat.includes('fit')) return 'health';
        if (cat.includes('culture') || cat.includes('society') || cat.includes('living')) return 'lifestyle';
        if (cat.includes('space') || cat.includes('bio') || cat.includes('physic')) return 'science';

        return 'world'; // Catch-all for international/general
    }
}

module.exports = new NewsMeshService();
