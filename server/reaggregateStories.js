/**
 * Re-aggregate Stories with Diverse Sources
 *
 * This script re-processes existing aggregated stories by pulling in diverse
 * sources from their underlying news_items clusters, ensuring each story
 * has sources from different political perspectives.
 *
 * Run with: node reaggregateStories.js
 */

const dbService = require('./services/dbService');
const sourceClassification = require('./services/sourceClassification');

// Wait for dbService to initialize
setTimeout(async () => {
    await reaggregateStories();
    process.exit(0);
}, 2000);

async function reaggregateStories() {
    console.log('🔄 Re-aggregating stories with diverse sources...\n');

    // Fetch all aggregated stories with their cluster_id
    const { data: stories, error } = await dbService.supabase
        .from('aggregated_stories')
        .select('id, title, cluster_id, sources')
        .eq('status', 'CLIP_READY');

    if (error) {
        console.error('❌ Failed to fetch stories:', error.message);
        return;
    }

    console.log(`📋 Found ${stories.length} stories to process\n`);

    let updated = 0;
    let skipped = 0;

    for (const story of stories) {
        // Skip stories without a cluster_id
        if (!story.cluster_id) {
            skipped++;
            continue;
        }

        // Get ALL articles in this cluster
        const { data: articles, error: articlesError } = await dbService.supabase
            .from('news_items')
            .select('id, sourceAPI, imageURL, articleURL, title')
            .eq('cluster_id', story.cluster_id);

        if (articlesError || !articles || articles.length === 0) {
            skipped++;
            continue;
        }

        // Convert articles to source format
        const rawSources = articles.map(article => ({
            sourceAPI: article.sourceAPI,
            iconURL: article.imageURL,
            articleURL: article.articleURL,
            originalTitle: article.title
        }));

        // Deduplicate by sourceAPI (keep first occurrence)
        const uniqueSourceMap = new Map();
        for (const source of rawSources) {
            const key = source.sourceAPI;
            if (!uniqueSourceMap.has(key)) {
                uniqueSourceMap.set(key, source);
            }
        }
        const uniqueSources = Array.from(uniqueSourceMap.values());

        // Apply diversity filter to pick best left + right (or center) combination
        const diversifiedSources = sourceClassification.filterAndDiversifySources(uniqueSources);

        // Only update if we have meaningful diversity
        if (diversifiedSources.length >= 1) {
            const { error: updateError } = await dbService.supabase
                .from('aggregated_stories')
                .update({
                    sources: diversifiedSources,
                    sourceCount: diversifiedSources.length
                })
                .eq('id', story.id);

            if (updateError) {
                console.error(`❌ Failed to update story ${story.id}:`, updateError.message);
            } else {
                updated++;
                const leanings = diversifiedSources.map(s => s.leaning).join(' + ');
                const names = diversifiedSources.map(s => s.sourceAPI?.replace('RSS - ', '')).join(' | ');
                console.log(`✅ "${story.title.substring(0, 50)}..." → [${leanings}] ${names}`);
            }
        } else {
            skipped++;
        }
    }

    console.log(`\n🎉 Re-aggregation complete! Updated ${updated} stories, skipped ${skipped}.`);
}
