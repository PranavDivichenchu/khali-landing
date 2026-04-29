/**
 * Fix Multi-Source Data
 *
 * This script removes duplicate/fake sources that were added by the broken backfill.
 * It will only keep sources that have UNIQUE sourceAPI values.
 *
 * Run with: node fixMultiSource.js
 */

const dbService = require('./services/dbService');
const sourceClassification = require('./services/sourceClassification');

// Wait for dbService to initialize
setTimeout(async () => {
    await fixSources();
    process.exit(0);
}, 2000);

async function fixSources() {
    console.log('🔧 Fixing multi-source data (removing duplicates)...\n');

    // Fetch all aggregated stories
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

        if (currentSources.length === 0) continue;

        // Remove duplicate sourceAPIs and fake "Multiple Sources" entries
        const uniqueSourceMap = new Map();

        for (const source of currentSources) {
            // Skip fake placeholder sources
            if (source.sourceAPI === 'Multiple Sources') continue;

            const key = source.sourceAPI || source.articleURL;
            if (!uniqueSourceMap.has(key)) {
                // Add leaning if not present
                const leaning = source.leaning || sourceClassification.getLeaningCategory(source.articleURL) || 'center';
                uniqueSourceMap.set(key, { ...source, leaning });
            }
        }

        const uniqueSources = Array.from(uniqueSourceMap.values());

        // Only update if we removed duplicates
        if (uniqueSources.length !== currentSources.length) {
            const { error: updateError } = await dbService.supabase
                .from('aggregated_stories')
                .update({
                    sources: uniqueSources,
                    sourceCount: uniqueSources.length
                })
                .eq('id', story.id);

            if (updateError) {
                console.error(`❌ Failed to fix story ${story.id}:`, updateError.message);
            } else {
                updated++;
                console.log(`✅ Fixed "${story.title.substring(0, 50)}..." - now has ${uniqueSources.length} unique source(s)`);
            }
        }
    }

    console.log(`\n🎉 Fix complete! Updated ${updated} stories.`);
}
