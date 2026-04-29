const Parser = require('rss-parser');
const parser = new Parser();

// Spam patterns to filter out at ingestion time (before AI processing)
// Spam patterns to filter out at ingestion time (before AI processing)
const SPAM_PATTERNS = [
    // Shopping/E-commerce (Aggressive)
    /deals/i, /coupon/i, /promo code/i,
    /top \d+ (products|items|gifts)/i, /gift guide/i, /buying guide/i,
    /daily deal/i, /weekly ad/i, /black friday/i, /cyber monday/i,

    // Listicle Filter (Loosened - only block clear clickbait/ads)
    /hacks/i, /gadgets you need/i, /perfect for your/i,

    // Generic promotional (Aggressive)
    /sponsored content/i, /partner content/i, /advertisement/i, /paid post/i
];

class RssService {
    /**
     * Check if a title/content matches spam patterns
     */
    isSpam(title, content = '') {
        const text = `${title} ${content}`.toLowerCase();
        for (const pattern of SPAM_PATTERNS) {
            if (pattern.test(text)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Fetch and parse a single RSS feed
     * @param {string} feedUrl 
     * @returns {Promise<Array>} Array of standardized news items
     */
    async fetchFeed(feedUrl, sourceName) {
        try {
            // Use a timeout for fetching
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const feed = await parser.parseURL(feedUrl).finally(() => clearTimeout(timeout));
            console.log(`[RSS] Fetched ${feed.items.length} items from ${sourceName}`);

            return feed.items
                .filter(item => {
                    if (!item.title) return false;
                    // Pre-filter spam before it enters our database
                    if (this.isSpam(item.title, item.contentSnippet || item.content || '')) {
                        console.log(`   [SPAM FILTER] Rejected: "${item.title}"`);
                        return false;
                    }
                    return true;
                })
                .map(item => {
                    // Extract image from various RSS fields
                    let imageUrl = null;

                    // 1. Check enclosure (common for media)
                    if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
                        imageUrl = item.enclosure.url;
                    }

                    // 2. Check media:content or media:thumbnail (used by many news sites)
                    if (!imageUrl && item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
                        imageUrl = item['media:content']['$'].url;
                    }
                    if (!imageUrl && item['media:thumbnail'] && item['media:thumbnail']['$'] && item['media:thumbnail']['$'].url) {
                        imageUrl = item['media:thumbnail']['$'].url;
                    }

                    // 3. Check itunes:image (podcasts, but sometimes used)
                    if (!imageUrl && item['itunes:image'] && item['itunes:image']['$'] && item['itunes:image']['$'].href) {
                        imageUrl = item['itunes:image']['$'].href;
                    }

                    // 4. Try to extract from content HTML (last resort)
                    if (!imageUrl && item.content) {
                        const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (imgMatch && imgMatch[1]) {
                            imageUrl = imgMatch[1];
                        }
                    }

                    return {
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                        content: item.contentSnippet || item.content || item.summary || '',
                        source: sourceName,
                        guid: item.guid || item.link,
                        imageUrl: imageUrl // New field
                    };
                });
        } catch (error) {
            // Extract more info if it's a parse error (like the character error in logs)
            const errorMsg = error.message || 'Unknown error';

            // Clean up common XML error noise for clearer logs
            const simplifiedMsg = errorMsg
                .replace(/Attribute without value\nLine: \d+\nColumn: \d+\nChar: .*/gs, 'XML Format Error (Malformed HTML?)')
                .replace(/Invalid character in entity name\nLine: \d+\nColumn: \d+\nChar: .*/gs, 'XML Entity Error');

            console.error(`[RSS Warning] Failed to fetch feed ${sourceName} (${feedUrl}):`, simplifiedMsg);

            // If it's a status code error, we might want to return that for back-off logic
            if (errorMsg.includes('Status code')) {
                const code = parseInt(errorMsg.match(/Status code (\d+)/)?.[1] || '0');
                if (code === 404 || code === 403 || code === 401) {
                    return { error: true, statusCode: code };
                }
            }
            return [];
        }
    }
}

module.exports = new RssService();
