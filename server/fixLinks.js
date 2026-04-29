
const { createClient } = require('@supabase/supabase-js');
const dbService = require('./services/dbService');

setTimeout(async () => {
    console.log('🔗 Fixing broken synthesized links...');

    // We can't use complex SQL via client easily without raw SQL support in this setup,
    // so we'll fetch and update items manually which is safer anyway.

    const { data: stories } = await dbService.supabase
        .from('aggregated_stories')
        .select('*')
        .eq('status', 'CLIP_READY');

    let fixed = 0;

    for (const story of stories) {
        if (!story.sources || story.sources.length < 2) continue;

        let changed = false;
        const newSources = [...story.sources];

        // Check if second source is synthesized and missing URL
        if (newSources[1].sourceAPI === 'Synthesized' && !newSources[1].articleURL) {
            newSources[1].articleURL = newSources[0].articleURL;
            changed = true;
        }

        if (changed) {
            await dbService.supabase
                .from('aggregated_stories')
                .update({ sources: newSources })
                .eq('id', story.id);
            fixed++;
        }
    }

    console.log(`✅ Fixed ${fixed} broken links.`);
    process.exit(0);
}, 1000);
