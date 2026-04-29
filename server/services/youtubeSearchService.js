const https = require('https');

class YouTubeSearchService {
    /**
     * Searches YouTube for a video ID based on a query
     * Scrapes the results page (like the Python script did)
     */
    async searchVideo(query) {
        console.log(`🔍 Searching YouTube for: "${query}"`);

        // Add reputable news sources to increase relevance
        const newsSources = ['CNN', 'BBC', 'NBC', 'Reuters', 'AP News', 'PBS'];
        const enhancedQuery = `${query} ${newsSources[Math.floor(Math.random() * newsSources.length)]}`;

        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(enhancedQuery)}`;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        return new Promise((resolve, reject) => {
            https.get(searchUrl, options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        // Extract video data including titles for relevance checking
                        const videoRegex = /"videoId":"(.*?)"/g;
                        const titleRegex = /"title":{"runs":\[{"text":"(.*?)"}/g;

                        const videoMatches = [...data.matchAll(videoRegex)];
                        const titleMatches = [...data.matchAll(titleRegex)];

                        if (videoMatches && videoMatches.length > 0) {
                            // Try to find best match by checking title relevance
                            const queryKeywords = query.toLowerCase().split(' ').filter(w => w.length > 3);

                            for (let i = 0; i < Math.min(videoMatches.length, titleMatches.length, 5); i++) {
                                const videoId = videoMatches[i][1];
                                const videoTitle = titleMatches[i][1].toLowerCase();

                                // Skip music videos, vlogs, and non-news content
                                if (videoTitle.includes('official music video') ||
                                    videoTitle.includes('vlog') ||
                                    videoTitle.includes('reaction') ||
                                    videoTitle.includes('gameplay')) {
                                    continue;
                                }

                                // Check if video title contains key terms from article
                                const relevanceScore = queryKeywords.filter(kw => videoTitle.includes(kw)).length;

                                if (relevanceScore >= 2) { // At least 2 keywords match
                                    console.log(`   🎥 Found relevant video: ${videoId} (score: ${relevanceScore})`);
                                    resolve(videoId);
                                    return;
                                }
                            }

                            // Fallback to first result if no highly relevant match found
                            const videoId = videoMatches[0][1];
                            console.log(`   🎥 Found YouTube ID (fallback): ${videoId}`);
                            resolve(videoId);
                        } else {
                            console.warn(`   ⚠️ No video ID found for query: ${query}`);
                            resolve(null);
                        }
                    } catch (err) {
                        console.error(`   ❌ YouTube parsing error: ${err.message}`);
                        resolve(null);
                    }
                });
            }).on('error', (err) => {
                console.error(`   ❌ YouTube search error: ${err.message}`);
                resolve(null);
            });
        });
    }
}

module.exports = new YouTubeSearchService();
