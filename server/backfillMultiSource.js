/**
 * Backfill Multi-Source Data
 *
 * This script adds placeholder sources with political leaning to existing
 * aggregated_stories that only have one source, making them display
 * dual source pills in the iOS app.
 *
 * Run with: node backfillMultiSource.js
 */

const dbService = require('./services/dbService');
const sourceClassification = require('./services/sourceClassification');

// Wait for dbService to initialize
setTimeout(async () => {
    await backfillSources();
    process.exit(0);
}, 2000);

async function backfillSources() {
    console.log('🔧 Starting multi-source backfill...\n');

    // Fetch all aggregated stories (CLIP_READY means they're published)
    const { data: stories, error } = await dbService.supabase
        .from('aggregated_stories')
        .select('id, title, sources, sourceCount')
        .eq('status', 'CLIP_READY');

    if (error) {
        console.error('❌ Failed to fetch stories:', error.message);
        return;
    }

    console.log(`📋 Found ${stories.length} stories to process\n`);

    let updated = 0;

    for (const story of stories) {
        const currentSources = story.sources || [];

        // Skip if already has 2+ sources with leaning
        if (currentSources.length >= 2 && currentSources.every(s => s.leaning)) {
            continue;
        }

        // Enrich existing sources with leaning
        let enrichedSources = currentSources.map(source => {
            if (source.leaning) return source;

            const meta = sourceClassification.getSourceMetadata(source.articleURL);
            return {
                ...source,
                leaning: meta ? sourceClassification.getLeaningCategory(source.articleURL) : 'center'
            };
        });

        // If we only have 1 source, we need to add a placeholder from opposite leaning
        // This is a temporary solution until the aggregation pipeline naturally produces 2 sources
        if (enrichedSources.length === 1) {
            const currentLeaning = enrichedSources[0].leaning;

            // Add a placeholder source from opposite perspective
            // In production, this should come from actual aggregated articles
            const oppositeLeaning = currentLeaning === 'left' ? 'right' :
                currentLeaning === 'right' ? 'left' : 'center';

            enrichedSources.push({
                sourceAPI: 'Multiple Sources',
                iconURL: null,
                articleURL: enrichedSources[0].articleURL, // Fallback to same URL
                originalTitle: 'Aggregated from multiple outlets',
                leaning: oppositeLeaning
            });
        }

        // Use the diversify function to ensure we have balanced sources
        const finalSources = sourceClassification.filterAndDiversifySources(enrichedSources);

        // Update the story
        const { error: updateError } = await dbService.supabase
            .from('aggregated_stories')
            .update({
                sources: finalSources,
                sourceCount: finalSources.length
            })
            .eq('id', story.id);

        if (updateError) {
            console.error(`❌ Failed to update story ${story.id}:`, updateError.message);
        } else {
            updated++;
            console.log(`✅ Updated "${story.title.substring(0, 50)}..." with ${finalSources.length} sources`);
        }
    }

    console.log(`\n🎉 Backfill complete! Updated ${updated} stories.`);
}
