// One-time cleanup script to delete posts made before OpenAI API was working
// Fallback posts have claim = "See full story for details."

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanupFallbackPosts() {
    console.log('🧹 Cleaning up posts created with fallback synthesis...\n');

    // 1. Find aggregated stories with fallback claim
    const { data: fallbackStories, error: fetchError } = await supabase
        .from('aggregated_stories')
        .select('id, title, claim, cluster_id')
        .eq('claim', 'See full story for details.');

    if (fetchError) {
        console.error('Error fetching fallback stories:', fetchError.message);
        return;
    }

    console.log(`Found ${fallbackStories.length} fallback stories to delete:\n`);
    fallbackStories.forEach(s => console.log(`  - ${s.title}`));
    console.log('');

    if (fallbackStories.length === 0) {
        console.log('✅ No fallback posts found. Database is clean!');
        return;
    }

    const storyIds = fallbackStories.map(s => s.id);
    const clusterIds = fallbackStories.map(s => s.cluster_id).filter(Boolean);

    // 2. Delete associated clips
    const { error: clipsError, count: clipsDeleted } = await supabase
        .from('clips')
        .delete()
        .in('aggregated_story_id', storyIds);

    if (clipsError) {
        console.error('Error deleting clips:', clipsError.message);
    } else {
        console.log(`🗑️  Deleted clips for ${storyIds.length} stories`);
    }

    // 3. Delete user votes for these stories
    const { error: votesError } = await supabase
        .from('user_votes')
        .delete()
        .in('story_id', storyIds);

    if (votesError && !votesError.message.includes('does not exist')) {
        console.error('Error deleting votes:', votesError.message);
    } else {
        console.log(`🗑️  Deleted user votes for these stories`);
    }

    // 4. Delete the aggregated stories themselves
    const { error: storiesError } = await supabase
        .from('aggregated_stories')
        .delete()
        .in('id', storyIds);

    if (storiesError) {
        console.error('Error deleting stories:', storiesError.message);
    } else {
        console.log(`🗑️  Deleted ${storyIds.length} aggregated stories`);
    }

    // 5. Delete associated news_items
    if (clusterIds.length > 0) {
        const { error: newsError } = await supabase
            .from('news_items')
            .delete()
            .in('cluster_id', clusterIds);

        if (newsError) {
            console.error('Error deleting news items:', newsError.message);
        } else {
            console.log(`🗑️  Deleted news_items for ${clusterIds.length} clusters`);
        }
    }

    // 6. Delete the clusters
    if (clusterIds.length > 0) {
        const { error: clustersError } = await supabase
            .from('event_clusters')
            .delete()
            .in('id', clusterIds);

        if (clustersError) {
            console.error('Error deleting clusters:', clustersError.message);
        } else {
            console.log(`🗑️  Deleted ${clusterIds.length} event_clusters`);
        }
    }

    console.log('\n✅ Cleanup complete!');
}

cleanupFallbackPosts().catch(console.error);
