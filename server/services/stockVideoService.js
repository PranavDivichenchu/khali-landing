const { v4: uuidv4 } = require('uuid');

class StockVideoService {
    constructor() {
        this.apiKey = process.env.PEXELS_API_KEY;
        this.baseUrl = 'https://api.pexels.com/videos';

        // Track recently used video IDs to avoid duplicates across stories
        this.recentlyUsedIds = new Set();
        this.MAX_RECENT_IDS = 100;

        // Category-specific fallback queries for better relevance
        this.CATEGORY_QUERIES = {
            politics: 'government building capitol congress official speech',
            technology: 'computer screen coding software digital innovation',
            business: 'office building corporate meeting stock market trading',
            sports: 'athletes stadium competition sports arena crowd',
            entertainment: 'stage performance concert lights audience show',
            health: 'hospital medical doctor healthcare clinic patient',
            science: 'laboratory research scientist microscope experiment',
            lifestyle: 'city people walking urban modern lifestyle',
            environment: 'nature forest ocean climate earth landscape',
            world: 'globe city skyline international travel destination'
        };

        if (!this.apiKey) {
            console.warn('[Stock Video Service] ⚠️ PEXELS_API_KEY is missing! Video search will fail.');
        } else {
            console.log('[Stock Video Service] Initialized with Pexels API (enhanced search)');
        }
    }

    /**
     * Search for a stock video using multiple strategies.
     * Strategy: Primary keywords → Alt keywords → Category-specific query → Generic fallback
     * @param {string} visualKeywords - Primary search keywords
     * @param {string} category - Story category
     * @param {string} altKeywords - Alternative search keywords (optional)
     * @returns {Promise<object|null>} - { link, duration, credits } or null
     */
    async searchVideo(visualKeywords, category, altKeywords = null) {
        if (!this.apiKey) return null;

        // Strategy 1: Try primary visual keywords
        if (visualKeywords && visualKeywords.length > 2) {
            console.log(`[Stock Video Service] 🔍 Strategy 1: Primary keywords: "${visualKeywords}"`);
            const result = await this._performSearch(visualKeywords);
            if (result) return result;
        }

        // Strategy 2: Try alternative keywords
        if (altKeywords && altKeywords.length > 2) {
            console.log(`[Stock Video Service] 🔍 Strategy 2: Alt keywords: "${altKeywords}"`);
            const result = await this._performSearch(altKeywords);
            if (result) return result;
        }

        // Strategy 3: Try category-specific curated query
        const categoryQuery = this.CATEGORY_QUERIES[category?.toLowerCase()];
        if (categoryQuery) {
            console.log(`[Stock Video Service] 🔍 Strategy 3: Category query for "${category}": "${categoryQuery}"`);
            const result = await this._performSearch(categoryQuery);
            if (result) return result;
        }

        // Strategy 4: Last resort generic fallback
        console.log(`[Stock Video Service] 🔍 Strategy 4: Generic fallback`);
        return await this._performSearch('news broadcast background abstract');
    }

    async _performSearch(query) {
        try {
            const params = new URLSearchParams({
                query: query,
                orientation: 'portrait',
                size: 'medium',
                per_page: 15 // Fetch more to pick the best one
            });

            const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
                headers: {
                    'Authorization': this.apiKey
                }
            });

            if (!response.ok) {
                console.error(`[Stock Video Service] Pexels API Error: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();

            if (!data.videos || data.videos.length === 0) {
                return null;
            }

            // Score and rank all videos
            const scoredVideos = [];

            for (const video of data.videos) {
                // Skip recently used videos to avoid duplicates
                if (this.recentlyUsedIds.has(video.id)) {
                    continue;
                }

                const bestFile = this._chooseBestVideoFile(video.video_files);
                if (!bestFile) continue;

                // Score this video for relevance
                const score = this._scoreVideo(video, bestFile);

                scoredVideos.push({
                    video,
                    file: bestFile,
                    score
                });
            }

            // Sort by score descending
            scoredVideos.sort((a, b) => b.score - a.score);

            // Pick the best scoring video
            if (scoredVideos.length > 0) {
                const best = scoredVideos[0];
                const video = best.video;
                const bestFile = best.file;

                // Track this video ID to avoid reuse
                this._trackUsedId(video.id);

                console.log(`[Stock Video Service] ✅ Found video (ID: ${video.id}, Score: ${best.score.toFixed(1)}, Res: ${bestFile.width}x${bestFile.height}, Duration: ${video.duration}s)`);

                return {
                    link: bestFile.link,
                    duration: video.duration,
                    credits: {
                        photographer: video.user.name,
                        photographer_url: video.user.url,
                        source: "Pexels"
                    }
                };
            }

            return null;

        } catch (error) {
            console.error('[Stock Video Service] Search Exception:', error.message);
            return null;
        }
    }

    /**
     * Score a video for relevance. Higher = better.
     * Factors: duration (prefer 15-45s), resolution, orientation
     */
    _scoreVideo(video, file) {
        let score = 0;

        // Duration scoring: prefer 15-45 seconds (ideal for news background loops)
        const duration = video.duration || 0;
        if (duration >= 15 && duration <= 45) {
            score += 30; // Perfect range
        } else if (duration >= 10 && duration <= 60) {
            score += 20; // Acceptable range
        } else if (duration >= 5) {
            score += 10; // Short but usable
        } else {
            score += 0; // Too short
        }

        // Resolution scoring: prefer 720p-1080p height
        const height = file.height || 0;
        if (height >= 1080 && height <= 1920) {
            score += 25; // Full HD vertical
        } else if (height >= 720) {
            score += 20; // HD
        } else if (height >= 480) {
            score += 10; // SD
        }

        // Portrait orientation bonus (height > width)
        if (file.height > file.width) {
            score += 15; // True portrait
        }

        // Slight randomization to avoid always picking the same video
        // when scores are similar across different stories
        score += Math.random() * 5;

        return score;
    }

    /**
     * Track a video ID as recently used (ring buffer behavior)
     */
    _trackUsedId(videoId) {
        this.recentlyUsedIds.add(videoId);

        // Trim the set if it gets too large (oldest entries removed)
        if (this.recentlyUsedIds.size > this.MAX_RECENT_IDS) {
            const iterator = this.recentlyUsedIds.values();
            this.recentlyUsedIds.delete(iterator.next().value);
        }
    }

    _chooseBestVideoFile(files) {
        if (!files || files.length === 0) return null;

        // Filter for MP4s only (avoid HLS/M3U8 for iOS compatibility)
        const mp4Files = files.filter(f => f.file_type === 'video/mp4');
        if (mp4Files.length === 0) return null;

        // Sort by how close they are to ideal vertical resolution (1280px height)
        mp4Files.sort((a, b) => {
            const diffA = Math.abs(a.height - 1280);
            const diffB = Math.abs(b.height - 1280);
            return diffA - diffB;
        });

        return mp4Files[0];
    }
}

module.exports = new StockVideoService();
