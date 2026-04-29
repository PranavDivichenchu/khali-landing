/**
 * Source Classification Service
 *
 * Provides political leaning and credibility ratings for news sources
 * based on AllSides, MediaBiasFactCheck, and Ad Fontes Media ratings.
 */

// Comprehensive source metadata - now includes both domains AND feed names
// leaning: 'left' | 'center-left' | 'center' | 'center-right' | 'right'
// credibility: 'high' | 'medium' | 'low'
const SOURCE_METADATA = {
    // === LEFT-LEANING, HIGH CREDIBILITY ===
    'nytimes.com': { leaning: 'left', credibility: 'high', name: 'New York Times' },
    'New York Times': { leaning: 'left', credibility: 'high', name: 'New York Times' },
    'washingtonpost.com': { leaning: 'left', credibility: 'high', name: 'Washington Post' },
    'theguardian.com': { leaning: 'left', credibility: 'high', name: 'The Guardian' },
    'The Guardian': { leaning: 'left', credibility: 'high', name: 'The Guardian' },
    'npr.org': { leaning: 'center-left', credibility: 'high', name: 'NPR' },
    'NPR': { leaning: 'center-left', credibility: 'high', name: 'NPR' },
    'pbs.org': { leaning: 'center-left', credibility: 'high', name: 'PBS' },
    'latimes.com': { leaning: 'left', credibility: 'high', name: 'LA Times' },
    'Los Angeles Times': { leaning: 'left', credibility: 'high', name: 'LA Times' },
    'bostonglobe.com': { leaning: 'left', credibility: 'high', name: 'Boston Globe' },
    'theatlantic.com': { leaning: 'left', credibility: 'high', name: 'The Atlantic' },
    'The Atlantic': { leaning: 'left', credibility: 'high', name: 'The Atlantic' },

    // === LEFT-LEANING, MEDIUM CREDIBILITY ===
    'cnn.com': { leaning: 'left', credibility: 'medium', name: 'CNN' },
    'CNN': { leaning: 'left', credibility: 'medium', name: 'CNN' },
    'msnbc.com': { leaning: 'left', credibility: 'medium', name: 'MSNBC' },
    'MSNBC': { leaning: 'left', credibility: 'medium', name: 'MSNBC' },
    'huffpost.com': { leaning: 'left', credibility: 'medium', name: 'HuffPost' },
    'HuffPost': { leaning: 'left', credibility: 'medium', name: 'HuffPost' },
    'HuffPost Politics': { leaning: 'left', credibility: 'medium', name: 'HuffPost' },
    'vox.com': { leaning: 'left', credibility: 'medium', name: 'Vox' },
    'Vox': { leaning: 'left', credibility: 'medium', name: 'Vox' },
    'slate.com': { leaning: 'left', credibility: 'medium', name: 'Slate' },
    'Rolling Stone': { leaning: 'left', credibility: 'medium', name: 'Rolling Stone' },
    'Vulture': { leaning: 'left', credibility: 'medium', name: 'Vulture' },

    // === CENTER, HIGH CREDIBILITY ===
    'reuters.com': { leaning: 'center', credibility: 'high', name: 'Reuters' },
    'Reuters': { leaning: 'center', credibility: 'high', name: 'Reuters' },
    'Reuters Top News': { leaning: 'center', credibility: 'high', name: 'Reuters' },
    'Reuters World': { leaning: 'center', credibility: 'high', name: 'Reuters' },
    'apnews.com': { leaning: 'center', credibility: 'high', name: 'AP News' },
    'Associated Press': { leaning: 'center', credibility: 'high', name: 'AP News' },
    'axios.com': { leaning: 'center', credibility: 'high', name: 'Axios' },
    'Axios': { leaning: 'center', credibility: 'high', name: 'Axios' },
    'politico.com': { leaning: 'center', credibility: 'high', name: 'Politico' },
    'Politico': { leaning: 'center', credibility: 'high', name: 'Politico' },
    'bbc.com': { leaning: 'center', credibility: 'high', name: 'BBC' },
    'bbc.co.uk': { leaning: 'center', credibility: 'high', name: 'BBC' },
    'BBC News': { leaning: 'center', credibility: 'high', name: 'BBC' },
    'BBC News World': { leaning: 'center', credibility: 'high', name: 'BBC' },
    'thehill.com': { leaning: 'center', credibility: 'high', name: 'The Hill' },
    'The Hill': { leaning: 'center', credibility: 'high', name: 'The Hill' },
    'usatoday.com': { leaning: 'center', credibility: 'high', name: 'USA Today' },
    'USA Today': { leaning: 'center', credibility: 'high', name: 'USA Today' },
    'abcnews.go.com': { leaning: 'center', credibility: 'high', name: 'ABC News' },
    'ABC News': { leaning: 'center', credibility: 'high', name: 'ABC News' },
    'cbsnews.com': { leaning: 'center', credibility: 'high', name: 'CBS News' },
    'CBS News': { leaning: 'center', credibility: 'high', name: 'CBS News' },
    'CBS Sports': { leaning: 'center', credibility: 'high', name: 'CBS Sports' },
    'nbcnews.com': { leaning: 'center', credibility: 'high', name: 'NBC News' },
    'NBC News': { leaning: 'center', credibility: 'high', name: 'NBC News' },
    'MSNBC Top Stories': { leaning: 'left', credibility: 'medium', name: 'MSNBC' },
    'bloomberg.com': { leaning: 'center', credibility: 'high', name: 'Bloomberg' },
    'Bloomberg': { leaning: 'center', credibility: 'high', name: 'Bloomberg' },
    'ESPN': { leaning: 'center', credibility: 'high', name: 'ESPN' },
    'ESPN Top News': { leaning: 'center', credibility: 'high', name: 'ESPN' },
    'Al Jazeera': { leaning: 'center', credibility: 'high', name: 'Al Jazeera' },
    'Deutsche Welle': { leaning: 'center', credibility: 'high', name: 'DW' },
    'Agence France-Presse': { leaning: 'center', credibility: 'high', name: 'AFP' },
    'CBC Canada': { leaning: 'center', credibility: 'high', name: 'CBC' },
    'Le Monde': { leaning: 'center', credibility: 'high', name: 'Le Monde' },
    'Financial Times': { leaning: 'center', credibility: 'high', name: 'Financial Times' },
    'CNBC': { leaning: 'center', credibility: 'high', name: 'CNBC' },
    'CNBC Top News': { leaning: 'center', credibility: 'high', name: 'CNBC' },
    'MarketWatch': { leaning: 'center', credibility: 'high', name: 'MarketWatch' },

    // === RIGHT-LEANING, HIGH CREDIBILITY ===
    'wsj.com': { leaning: 'center-right', credibility: 'high', name: 'Wall Street Journal' },
    'Wall Street Journal': { leaning: 'center-right', credibility: 'high', name: 'WSJ' },
    'WSJ Markets': { leaning: 'center-right', credibility: 'high', name: 'WSJ' },
    'WSJ US Business': { leaning: 'center-right', credibility: 'high', name: 'WSJ' },
    'Wall Street Journal Business': { leaning: 'center-right', credibility: 'high', name: 'WSJ' },
    'economist.com': { leaning: 'center-right', credibility: 'high', name: 'The Economist' },
    'The Economist': { leaning: 'center-right', credibility: 'high', name: 'The Economist' },
    'nationalreview.com': { leaning: 'right', credibility: 'high', name: 'National Review' },
    'reason.com': { leaning: 'right', credibility: 'high', name: 'Reason' },
    'Forbes': { leaning: 'center-right', credibility: 'high', name: 'Forbes' },
    'Forbes Business': { leaning: 'center-right', credibility: 'high', name: 'Forbes' },

    // === RIGHT-LEANING, MEDIUM CREDIBILITY ===
    'foxnews.com': { leaning: 'right', credibility: 'medium', name: 'Fox News' },
    'Fox News': { leaning: 'right', credibility: 'medium', name: 'Fox News' },
    'Fox News Business': { leaning: 'right', credibility: 'medium', name: 'Fox News' },
    'nypost.com': { leaning: 'right', credibility: 'medium', name: 'New York Post' },
    'New York Post': { leaning: 'right', credibility: 'medium', name: 'New York Post' },
    'washingtonexaminer.com': { leaning: 'right', credibility: 'medium', name: 'Washington Examiner' },
    'Washington Examiner': { leaning: 'right', credibility: 'medium', name: 'Washington Examiner' },
    'dailywire.com': { leaning: 'right', credibility: 'medium', name: 'Daily Wire' },
    'Daily Wire': { leaning: 'right', credibility: 'medium', name: 'Daily Wire' },
    'The Federalist': { leaning: 'right', credibility: 'medium', name: 'The Federalist' },
    'thefederalist.com': { leaning: 'right', credibility: 'medium', name: 'The Federalist' },
    'Townhall': { leaning: 'right', credibility: 'medium', name: 'Townhall' },
    'townhall.com': { leaning: 'right', credibility: 'medium', name: 'Townhall' },
    'Washington Times': { leaning: 'right', credibility: 'medium', name: 'Washington Times' },
    'washingtontimes.com': { leaning: 'right', credibility: 'medium', name: 'Washington Times' },
    'Breitbart': { leaning: 'right', credibility: 'low', name: 'Breitbart' },
    'Breitbart Politics': { leaning: 'right', credibility: 'low', name: 'Breitbart' },
    'breitbart.com': { leaning: 'right', credibility: 'low', name: 'Breitbart' },
    'New York Post Politics': { leaning: 'right', credibility: 'medium', name: 'NY Post' },

    // === LEFT-LEANING, MEDIUM CREDIBILITY (New additions) ===
    'Mother Jones': { leaning: 'left', credibility: 'medium', name: 'Mother Jones' },
    'motherjones.com': { leaning: 'left', credibility: 'medium', name: 'Mother Jones' },
    'The Nation': { leaning: 'left', credibility: 'medium', name: 'The Nation' },
    'thenation.com': { leaning: 'left', credibility: 'medium', name: 'The Nation' },
    'Salon': { leaning: 'left', credibility: 'medium', name: 'Salon' },
    'salon.com': { leaning: 'left', credibility: 'medium', name: 'Salon' },
    'Daily Beast': { leaning: 'left', credibility: 'medium', name: 'Daily Beast' },
    'thedailybeast.com': { leaning: 'left', credibility: 'medium', name: 'Daily Beast' },

    // === CENTER POLITICAL ===
    'C-SPAN': { leaning: 'center', credibility: 'high', name: 'C-SPAN' },
    'c-span.org': { leaning: 'center', credibility: 'high', name: 'C-SPAN' },
    'RealClearPolitics': { leaning: 'center', credibility: 'high', name: 'RealClearPolitics' },
    'realclearpolitics.com': { leaning: 'center', credibility: 'high', name: 'RealClearPolitics' },

    // === SPORTS (Center - apolitical) ===

    'Yahoo Sports': { leaning: 'center', credibility: 'medium', name: 'Yahoo Sports' },
    'Bleacher Report': { leaning: 'center', credibility: 'medium', name: 'Bleacher Report' },
    'Sports Illustrated': { leaning: 'center', credibility: 'medium', name: 'Sports Illustrated' },
    'The Athletic': { leaning: 'center', credibility: 'high', name: 'The Athletic' },

    // === TECH (Lean left politically but high credibility on tech) ===
    'TechCrunch': { leaning: 'center-left', credibility: 'high', name: 'TechCrunch' },
    'The Verge': { leaning: 'center-left', credibility: 'high', name: 'The Verge' },
    'Hacker News': { leaning: 'center', credibility: 'high', name: 'Hacker News' },
    'VentureBeat': { leaning: 'center', credibility: 'high', name: 'VentureBeat' },
    'Mashable': { leaning: 'center-left', credibility: 'medium', name: 'Mashable' },
    'IEEE Spectrum': { leaning: 'center', credibility: 'high', name: 'IEEE Spectrum' },
    'OpenAI Blog': { leaning: 'center', credibility: 'high', name: 'OpenAI' },

    // === ENTERTAINMENT ===
    'Entertainment Weekly': { leaning: 'center-left', credibility: 'medium', name: 'Entertainment Weekly' },
    'People Magazine': { leaning: 'center', credibility: 'medium', name: 'People' },
    'Pitchfork': { leaning: 'center-left', credibility: 'medium', name: 'Pitchfork' },
    'Billboard': { leaning: 'center', credibility: 'medium', name: 'Billboard' },
    'Deadline': { leaning: 'center', credibility: 'high', name: 'Deadline' },

    // === SCIENCE/HEALTH ===
    'Nature': { leaning: 'center', credibility: 'high', name: 'Nature' },
    'ScienceDaily': { leaning: 'center', credibility: 'high', name: 'ScienceDaily' },
    'Scientific American': { leaning: 'center-left', credibility: 'high', name: 'Scientific American' },
    'Medical News Today': { leaning: 'center', credibility: 'high', name: 'Medical News Today' },
    'WebMD': { leaning: 'center', credibility: 'medium', name: 'WebMD' },
    'Stat News': { leaning: 'center', credibility: 'high', name: 'Stat News' },
    'NASA Breaking News': { leaning: 'center', credibility: 'high', name: 'NASA' },

    // === REGIONAL ===
    'Chicago Tribune': { leaning: 'center', credibility: 'high', name: 'Chicago Tribune' },
    'Business Insider': { leaning: 'center-left', credibility: 'medium', name: 'Business Insider' },
    'New Atlas': { leaning: 'center', credibility: 'medium', name: 'New Atlas' },
    'Grist': { leaning: 'center-left', credibility: 'high', name: 'Grist' },
    'Treehugger': { leaning: 'left', credibility: 'medium', name: 'Treehugger' },
};

/**
 * Get metadata for a source - handles both URLs and source names (with/without RSS prefix)
 * @param {string} urlOrName - Article URL, domain, or source name like "RSS - Fox News"
 * @returns {{ leaning: string, credibility: string, name: string } | null}
 */
function getSourceMetadata(urlOrName) {
    if (!urlOrName) return null;

    try {
        // 1. First try stripping "RSS - " prefix and looking up by name
        let cleanName = urlOrName.replace(/^RSS\s*-\s*/i, '').trim();

        // Direct name match
        if (SOURCE_METADATA[cleanName]) {
            return { ...SOURCE_METADATA[cleanName], domain: cleanName };
        }

        // 2. Try URL-based lookup
        if (urlOrName.includes('://') || urlOrName.includes('.')) {
            let domain = urlOrName;
            if (urlOrName.includes('://')) {
                domain = new URL(urlOrName).hostname;
            }
            domain = domain.replace(/^www\./, '');

            // Check direct match
            if (SOURCE_METADATA[domain]) {
                return { ...SOURCE_METADATA[domain], domain };
            }

            // Check subdomain matches (e.g., news.bbc.co.uk -> bbc.co.uk)
            for (const [key, value] of Object.entries(SOURCE_METADATA)) {
                if (domain.endsWith(key) || domain.endsWith('.' + key)) {
                    return { ...value, domain: key };
                }
            }
        }

        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Get the leaning category for a source
 * @param {string} urlOrName
 * @returns {'left' | 'center' | 'right' | null}
 */
function getLeaningCategory(urlOrName) {
    const meta = getSourceMetadata(urlOrName);
    if (!meta) return null;

    if (meta.leaning === 'left' || meta.leaning === 'center-left') return 'left';
    if (meta.leaning === 'right' || meta.leaning === 'center-right') return 'right';
    return 'center';
}

/**
 * Check if a source is credible (high or medium credibility)
 * @param {string} urlOrName
 * @returns {boolean}
 */
function isCredible(urlOrName) {
    const meta = getSourceMetadata(urlOrName);
    return meta && (meta.credibility === 'high' || meta.credibility === 'medium');
}

/**
 * Filter and diversify sources for an aggregated story
 * Ensures we have sources from different political perspectives
 * @param {Array} sources - Array of source objects with sourceAPI and/or articleURL
 * @returns {Array} - Filtered and diversified sources with leaning added
 */
function filterAndDiversifySources(sources) {
    if (!sources || sources.length === 0) return [];

    // Add metadata to each source - check both sourceAPI and articleURL
    const enrichedSources = sources.map(source => {
        // Try sourceAPI first (e.g., "RSS - Fox News"), then articleURL
        const meta = getSourceMetadata(source.sourceAPI) || getSourceMetadata(source.articleURL);
        const leaning = meta ? getLeaningCategory(source.sourceAPI) || getLeaningCategory(source.articleURL) : null;

        return {
            ...source,
            leaning: leaning,
            credibility: meta ? meta.credibility : null,
            displayName: meta ? meta.name : null,
            _meta: meta
        };
    });

    // Separate classified and unclassified sources
    const classifiedSources = enrichedSources.filter(s => s.leaning !== null);
    const unclassifiedSources = enrichedSources.filter(s => s.leaning === null);

    // Categorize by leaning
    const leftSources = classifiedSources.filter(s => s.leaning === 'left');
    const rightSources = classifiedSources.filter(s => s.leaning === 'right');
    const centerSources = classifiedSources.filter(s => s.leaning === 'center');

    // Build diverse array: prioritize one left + one right
    const result = [];

    // Prefer high credibility within each category
    const pickBest = (arr) => {
        const high = arr.find(s => s.credibility === 'high');
        return high || arr[0];
    };

    // Prioritize left + right combination for political stories
    if (leftSources.length > 0 && rightSources.length > 0) {
        result.push(pickBest(leftSources));
        result.push(pickBest(rightSources));
    } else if (leftSources.length > 0) {
        result.push(pickBest(leftSources));
        // Add center or unclassified as second
        if (centerSources.length > 0) {
            result.push(pickBest(centerSources));
        } else if (unclassifiedSources.length > 0) {
            result.push({ ...unclassifiedSources[0], leaning: 'center' });
        }
    } else if (rightSources.length > 0) {
        result.push(pickBest(rightSources));
        // Add center or unclassified as second
        if (centerSources.length > 0) {
            result.push(pickBest(centerSources));
        } else if (unclassifiedSources.length > 0) {
            result.push({ ...unclassifiedSources[0], leaning: 'center' });
        }
    } else if (centerSources.length >= 2) {
        // Have 2 different center sources
        result.push(centerSources[0]);
        result.push(centerSources[1]);
    } else if (centerSources.length === 1 && unclassifiedSources.length > 0) {
        result.push(centerSources[0]);
        result.push({ ...unclassifiedSources[0], leaning: 'center' });
    } else if (unclassifiedSources.length >= 2) {
        // Just take 2 unclassified sources
        result.push({ ...unclassifiedSources[0], leaning: 'center' });
        result.push({ ...unclassifiedSources[1], leaning: 'center' });
    } else if (enrichedSources.length >= 1) {
        // Fallback: just take what we have
        result.push({ ...enrichedSources[0], leaning: enrichedSources[0].leaning || 'center' });
        if (enrichedSources.length >= 2) {
            result.push({ ...enrichedSources[1], leaning: enrichedSources[1].leaning || 'center' });
        }
    }

    // ALWAYS ensure exactly 2 sources for dual-pill display
    if (result.length === 1 && enrichedSources.length >= 2) {
        // We have more sources available, pick another one
        const second = enrichedSources.find(s => s.sourceAPI !== result[0].sourceAPI);
        if (second) {
            result.push({ ...second, leaning: second.leaning || 'center' });
        }
    }

    if (result.length === 1) {
        // Only 1 unique source - add a synthesized placeholder
        const firstLeaning = result[0].leaning || 'center';
        const oppositeLeaning = firstLeaning === 'left' ? 'right' :
            firstLeaning === 'right' ? 'left' : 'center';
        result.push({
            sourceAPI: 'Synthesized',
            iconURL: null,
            articleURL: result[0].articleURL,
            originalTitle: 'Multiple perspectives analyzed',
            leaning: oppositeLeaning
        });
    }

    // Clean up internal metadata before returning
    return result.map(({ _meta, credibility, displayName, ...rest }) => rest);
}

module.exports = {
    getSourceMetadata,
    isCredible,
    getLeaningCategory,
    filterAndDiversifySources,
    SOURCE_METADATA
};
