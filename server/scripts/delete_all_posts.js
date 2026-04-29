require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function deleteAllPosts() {
    console.log('🗑️  Starting deletion of all posts...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY; // Prefer service key if available for deletions

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase credentials missing.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Delete aggregated_stories (cascades to user_votes)
        console.log('   Deleting from aggregated_stories...');
        const { error: aggError, data: aggData } = await supabase
            .from('aggregated_stories')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (aggError) throw aggError;
        console.log('   ✅ aggregated_stories cleared.');

        // 2. Delete news_items
        console.log('   Deleting from news_items...');
        const { error: newsError } = await supabase
            .from('news_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (newsError) throw newsError;
        console.log('   ✅ news_items cleared.');

        // 3. Delete event_clusters
        console.log('   Deleting from event_clusters...');
        const { error: clusterError } = await supabase
            .from('event_clusters')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (clusterError) throw clusterError;
        console.log('   ✅ event_clusters cleared.');

        // 4. Delete files from Supabase Storage 'clips' bucket
        console.log('   Deleting files from Supabase Storage "clips" bucket...');

        let deletedCount = 0;
        let hasMore = true;

        while (hasMore) {
            const { data: files, error: listError } = await supabase.storage.from('clips').list(null, { limit: 100 });

            if (listError) {
                console.error('   ⚠️ Could not list files in "clips" bucket:', listError.message);
                hasMore = false;
            } else if (files && files.length > 0) {
                const filesToRemove = files.map(x => x.name);
                const { error: deleteError } = await supabase.storage.from('clips').remove(filesToRemove);

                if (deleteError) {
                    console.error('   ❌ Failed to delete files from storage:', deleteError.message);
                    hasMore = false;
                } else {
                    deletedCount += filesToRemove.length;
                    console.log(`   Deleted batch of ${filesToRemove.length} files...`);
                    // If we got less than the limit, we're likely done, but the loop will check again or next iteration returns empty
                    if (files.length < 100) hasMore = false;
                }
            } else {
                hasMore = false;
            }
        }

        if (deletedCount > 0) {
            console.log(`   ✅ Deleted total ${deletedCount} files from Supabase Storage.`);
        } else {
            console.log('   ℹ️ No files found in Supabase Storage "clips" bucket.');
        }

        // 5. Clean up local directories
        const fs = require('fs');
        const path = require('path');
        const contentDirs = [
            path.join(__dirname, '../clips'),
            path.join(__dirname, '../downloads'), // Temp downloads
            path.join(__dirname, '../public/audio') // Temp TTS
        ];

        contentDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                console.log(`   Cleaning local directory: ${dir}`);
                fs.readdirSync(dir).forEach(file => {
                    // Keep .gitkeep if exists, or just delete everything
                    if (file !== '.gitkeep' && file !== '.gitignore') {
                        try {
                            fs.unlinkSync(path.join(dir, file));
                        } catch (e) {
                            console.warn(`   ⚠️ Failed to delete ${file}: ${e.message}`);
                        }
                    }
                });
            }
        });
        console.log('   ✅ Local directories cleaned.');

        console.log('🎉 Successfully deleted all old posts and related files.');

    } catch (err) {
        console.error('❌ Error during deletion:', err.message);
        process.exit(1);
    }
}

deleteAllPosts();
