const dbService = require('./dbService');
const aiService = require('./aiService');

class AggregationService {
    /**
     * Process clusters that are ready for aggregation (2+ articles)
     */
    async aggregateClusters() {
        try {
            console.log(`[Aggregator] Checking for clusters ready to aggregate...`);

            // Get clusters with article_count >= 2 that don't have an aggregated_story yet
            // This logic might need a more efficient query in production
            const readyClusters = await this._getReadyClusters();

            for (const cluster of readyClusters) {
                await this.synthesizeCluster(cluster.id);
            }
        } catch (error) {
            console.error(`[Aggregator] Error in aggregation loop:`, error.message);
        }
    }

    // Helper to map AI-generated categories to standard ones
    _mapCategory(cat) {
        if (!cat) return 'world'; // Default if no category is provided
        cat = cat.toLowerCase();
        if (cat.includes('us politics') || cat.includes('congress') || cat.includes('election')) return 'politics';
        if (cat.includes('tech') || cat.includes('ai') || cat.includes('crypto')) return 'technology';
        if (cat.includes('business') || cat.includes('finance') || cat.includes('market') || cat.includes('econ')) return 'business';
        if (cat.includes('sports')) return 'sports';
        if (cat.includes('entertainment') || cat.includes('movie') || cat.includes('music')) return 'entertainment';
        if (cat.includes('health') || cat.includes('med')) return 'health';
        if (cat.includes('science') || cat.includes('space')) return 'science';
        if (cat.includes('lifestyle') || cat.includes('fashion') || cat.includes('culture')) return 'lifestyle';
        if (cat.includes('climate') || cat.includes('environment')) return 'environment';
        return 'world';
    }

    async synthesizeCluster(clusterId) {
        try {
            // 1. Get all articles in this cluster
            const { data: articles, error } = await dbService.supabase
                .from('news_items')
                .select('*')
                .eq('cluster_id', clusterId);

            if (error || !articles || articles.length < 1) {
                // Not truly ready for synthesis yet
                return;
            }

            // 1.5 Deduplicate by sourceAPI (domain)
            const uniqueSources = new Map();
            articles.forEach(article => {
                const domain = article.sourceAPI;
                // If we have multiple from same domain, keep the one with a more detailed summary or image
                if (!uniqueSources.has(domain) ||
                    (article.summary.join('').length > uniqueSources.get(domain).summary.join('').length)) {
                    uniqueSources.set(domain, article);
                }
            });

            const deduplicatedArticles = Array.from(uniqueSources.values());

            if (deduplicatedArticles.length < 1) {
                console.log(`[Aggregator] Cluster ${clusterId} has 0 unique sources. Skipping.`);
                return;
            }

            console.log(`[Aggregator] Cluster ${clusterId} has ${deduplicatedArticles.length} unique sources. Synthesizing...`);

            // 2. Synthesize with GPT
            const synthesized = await aiService.synthesizeMultipleSources(deduplicatedArticles);

            // 2.5 Filter and diversify sources by credibility and political leaning
            const sourceClassification = require('./sourceClassification');
            let diversifiedSources = sourceClassification.filterAndDiversifySources(synthesized.sources);

            // ENSURE we always have 2 sources for dual-pill display
            if (diversifiedSources.length === 1) {
                const firstLeaning = diversifiedSources[0].leaning || 'center';
                const oppositeLeaning = firstLeaning === 'left' ? 'right' :
                    firstLeaning === 'right' ? 'left' : 'center';
                diversifiedSources.push({
                    sourceAPI: 'Synthesized',
                    iconURL: null,
                    articleURL: diversifiedSources[0].articleURL,
                    originalTitle: 'Multiple perspectives analyzed',
                    leaning: oppositeLeaning
                });
            }
            console.log(`[Aggregator] Diversified ${synthesized.sources.length} sources to ${diversifiedSources.length} balanced sources`);


            // 3. Save to aggregated_stories
            const payload = {
                cluster_id: clusterId,
                title: synthesized.title,
                summary: synthesized.summary,
                leftPerspective: synthesized.leftPerspective,
                rightPerspective: synthesized.rightPerspective,
                claim: synthesized.claim,
                sourceCount: diversifiedSources.length,
                sources: diversifiedSources, // Now includes leaning field
                date: synthesized.date,
                category: synthesized.category,
                audio_script: synthesized.audioScript, // Correct column name
                status: 'AGGREGATED' // Ready for next stages: TTS, Video, Clip
            };

            const { data, error: saveError } = await dbService.supabase
                .from('aggregated_stories')
                .upsert(payload, { onConflict: 'cluster_id' })
                .select()
                .single();

            if (saveError) throw saveError;

            console.log(`[Aggregator] Successfully aggregated ${articles.length} sources for: "${synthesized.title}"`);
            return data;
        } catch (error) {
            console.error(`[Aggregator] Failed to synthesize cluster ${clusterId}:`, error.message);
        }
    }

    async _getReadyClusters() {
        if (!dbService.supabase) return [];

        // Find clusters with 1+ articles that DON'T have a record in aggregated_stories
        // We use a left join and filter for nulls on the joined table
        const { data, error } = await dbService.supabase
            .from('event_clusters')
            .select(`
                id,
                representative_title,
                article_count,
                aggregated_stories!left (id)
            `)
            .gte('article_count', 2)
            .is('aggregated_stories', null)
            .order('updated_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error(`[Aggregator] Error fetching ready clusters:`, error.message);
            return [];
        }

        return data || [];
    }
}

module.exports = new AggregationService();
