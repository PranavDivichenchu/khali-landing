/**
 * Backfill Script: Replace Pexels stock video URLs with article images
 *
 * This script updates existing stories so that `clipUrl` uses the article's
 * own `imageURL` (from NewsMesh) instead of random Pexels stock footage.
 *
 * Run: node server/scripts/backfillArticleImages.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillNewsItems() {
    console.log('\n📰 Backfilling news_items...');

    // Fetch items that have an imageURL but clipUrl is either null or a Pexels URL
    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, "imageURL", "clipUrl"')
        .not('imageURL', 'is', null)
        .neq('imageURL', '');

    if (error) {
        console.error('❌ Error fetching news_items:', error.message);
        return { updated: 0, skipped: 0 };
    }

    console.log(`   Found ${items.length} items with imageURL`);

    let updated = 0;
    let skipped = 0;

    for (const item of items) {
        const imageURL = item.imageURL;
        const clipUrl = item.clipUrl;

        // Skip if no valid image URL
        if (!imageURL || !imageURL.startsWith('http')) {
            skipped++;
            continue;
        }

        // Skip if clipUrl already matches imageURL
        if (clipUrl === imageURL) {
            skipped++;
            continue;
        }

        // Update clipUrl to use imageURL
        const { error: updateError } = await supabase
            .from('news_items')
            .update({ clipUrl: imageURL })
            .eq('id', item.id);

        if (updateError) {
            console.error(`   ❌ Failed to update ${item.id}: ${updateError.message}`);
        } else {
            updated++;
            if (updated <= 5) {
                console.log(`   ✅ Updated: "${item.title?.substring(0, 50)}..." → ${imageURL.substring(0, 70)}...`);
            }
        }
    }

    console.log(`   📰 news_items: ${updated} updated, ${skipped} skipped`);
    return { updated, skipped };
}

async function backfillAggregatedStories() {
    console.log('\n📦 Backfilling aggregated_stories...');

    const { data: stories, error } = await supabase
        .from('aggregated_stories')
        .select('id, title, "imageURL", "clipUrl"');

    if (error) {
        console.error('❌ Error fetching aggregated_stories:', error.message);
        return { updated: 0, skipped: 0 };
    }

    console.log(`   Found ${stories.length} aggregated stories`);

    let updated = 0;
    let skipped = 0;

    for (const story of stories) {
        const imageURL = story.imageURL;
        const clipUrl = story.clipUrl;

        if (!imageURL || !imageURL.startsWith('http')) {
            skipped++;
            continue;
        }

        if (clipUrl === imageURL) {
            skipped++;
            continue;
        }

        const { error: updateError } = await supabase
            .from('aggregated_stories')
            .update({ clipUrl: imageURL })
            .eq('id', story.id);

        if (updateError) {
            console.error(`   ❌ Failed to update ${story.id}: ${updateError.message}`);
        } else {
            updated++;
            if (updated <= 5) {
                console.log(`   ✅ Updated: "${story.title?.substring(0, 50)}..." → ${imageURL.substring(0, 70)}...`);
            }
        }
    }

    console.log(`   📦 aggregated_stories: ${updated} updated, ${skipped} skipped`);
    return { updated, skipped };
}

async function main() {
    console.log('🔄 Backfill: Replacing stock video URLs with article images...\n');

    const newsResult = await backfillNewsItems();
    const aggResult = await backfillAggregatedStories();

    const totalUpdated = newsResult.updated + aggResult.updated;
    const totalSkipped = newsResult.skipped + aggResult.skipped;

    console.log(`\n✅ Done! ${totalUpdated} stories updated, ${totalSkipped} skipped.`);
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
});
