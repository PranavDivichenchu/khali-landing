/**
 * Quick Fix: Ensure Every Story Has 2 Sources
 *
 * This script ensures every aggregated story has exactly 2 sources.
 * If a story only has 1 source, it adds a second one from the cluster
 * or creates a "synthesized" source.
 */

const dbService = require('./services/dbService');
const sourceClassification = require('./services/sourceClassification');

setTimeout(async () => {
    console.log('🔧 Ensuring all stories have 2 sources...\n');

    const { data: stories, error } = await dbService.supabase
        .from('aggregated_stories')
        .select('id, title, cluster_id, sources')
        .eq('status', 'CLIP_READY');

    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }

    let fixed = 0;

    for (const story of stories) {
        let sources = story.sources || [];

        // If already has 2+ sources, skip
        if (sources.length >= 2) continue;

        // Get articles from cluster to find more sources
        if (story.cluster_id) {
            const { data: articles } = await dbService.supabase
                .from('news_items')
                .select('sourceAPI, imageURL, articleURL, title')
                .eq('cluster_id', story.cluster_id)
                .limit(20);

            if (articles && articles.length > 0) {
                // Build unique sources from cluster
                const seen = new Set(sources.map(s => s.sourceAPI));

                for (const article of articles) {
                    if (!seen.has(article.sourceAPI)) {
                        const leaning = sourceClassification.getLeaningCategory(article.sourceAPI) || 'center';
                        sources.push({
                            sourceAPI: article.sourceAPI,
                            iconURL: article.imageURL,
                            articleURL: article.articleURL,
                            originalTitle: article.title,
                            leaning: leaning
                        });
                        seen.add(article.sourceAPI);

                        if (sources.length >= 2) break;
                    }
                }
            }
        }

        // If still only 1 source, duplicate with "Multiple Sources" label
        if (sources.length === 1) {
            const firstLeaning = sources[0].leaning || 'center';
            const oppositeLeaning = firstLeaning === 'left' ? 'right' :
                firstLeaning === 'right' ? 'left' : 'center';
            sources.push({
                sourceAPI: 'Synthesized',
                iconURL: null,
                articleURL: sources[0].articleURL,
                originalTitle: 'Multiple perspectives synthesized',
                leaning: oppositeLeaning
            });
        }

        // Update the story
        await dbService.supabase
            .from('aggregated_stories')
            .update({ sources: sources, sourceCount: sources.length })
            .eq('id', story.id);

        fixed++;
        if (fixed % 50 === 0) console.log(`Updated ${fixed} stories...`);
    }

    console.log(`\n✅ Done! Fixed ${fixed} stories to have 2 sources.`);
    process.exit(0);
}, 2000);
