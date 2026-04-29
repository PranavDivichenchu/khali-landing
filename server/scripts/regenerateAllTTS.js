/**
 * Script to regenerate ALL TTS audio (Podcast Format) for all articles/stories
 * Run with: node scripts/regenerateAllTTS.js
 */

require('dotenv').config();
const dbService = require('../services/dbService');
const aiService = require('../services/aiService');
const fs = require('fs');
const path = require('path');

async function regenerateAllTTS() {
    console.log('🔄 Starting Podcast Regeneration (Voice: Sarah & Mike)...\n');

    try {
        // 1. Process Aggregated Stories (Primary Podcast Target)
        console.log('--- Processing Aggregated Stories ---');

        let processedCount = 0;
        let batchSize = 10;
        let hasMore = true;
        let start = 0;

        while (hasMore) {
            console.log(`\n📄 Fetching batch starting at ${start}...`);
            const { data: aggregated, error: aggError } = await dbService.supabase
                .from('aggregated_stories')
                .select('id, title, audio_script, podcast_audio_path')
                .in('status', ['CLIP_READY', 'FAILED_CLIP', 'FAILED_NO_VIDEO', 'PROCESSING_CLIP']) // Target all relevant statuses
                .range(start, start + batchSize - 1);

            if (aggError) {
                console.error('❌ Failed to fetch aggregated stories:', aggError.message);
                break;
            }

            if (!aggregated || aggregated.length === 0) {
                hasMore = false;
                break;
            }

            console.log(`📰 Found ${aggregated.length} stories in this batch.`);

            for (const story of aggregated) {
                await processItem(story, 'aggregated_stories');
                // Small delay to let Railway breathe
                await new Promise(r => setTimeout(r, 2000));
            }

            processedCount += aggregated.length;
            start += batchSize;

            // Safety break
            if (processedCount > 2000) hasMore = false;
        }

        // 2. Process Individual News Items (if they have scripts)
        console.log('\n--- Processing News Items ---');
        const { data: articles, error: artError } = await dbService.supabase
            .from('news_items')
            .select('id, title, audio_script, "podcastAudioPath"')
        // .eq('isOptimized', true) -- seems count is 0
        // .limit(50); 

        if (artError) console.error('❌ Failed to fetch news items:', artError.message);
        else console.log(`📰 Found ${articles.length} news items to process`);

        if (articles) {
            for (const article of articles) {
                await processItem(article, 'news_items');
            }
        }

    } catch (err) {
        console.error('❌ Script error:', err);
    }

    console.log('\n✅ Done!');
    process.exit(0);
}

async function processItem(item, table) {
    console.log(`\n🎤 Processing [${table}] "${item.title.substring(0, 40)}..."`);

    try {
        // 1. Prepare Dialogue
        let dialogue = item.audio_script;
        if (typeof dialogue === 'string') {
            try {
                dialogue = JSON.parse(dialogue);
                if (dialogue.podcastDialogue) dialogue = dialogue.podcastDialogue;
            } catch (e) { dialogue = null; }
        }

        if (!Array.isArray(dialogue) || dialogue.length === 0) {
            console.log(`   ⚠️ No valid dialogue script found. Skipping.`);
            return;
        }

        // 2. Generate Podcast Audio (Dialogue) & Captions
        console.log(`   🎙️ Generating Podcast with ${dialogue.length} turns...`);
        const result = await aiService.generatePodcast(dialogue);

        if (!result || !result.audioPath) {
            console.log('   ⚠️ Generation returned no audio path');
            return;
        }

        const captions = result.captions || [];
        const localPath = result.audioPath;

        // 3. Upload to Supabase
        const fileContent = fs.readFileSync(localPath);
        const fileName = `${path.basename(localPath)}`;

        const { error: uploadError } = await dbService.supabase.storage
            .from('clips')
            .upload(fileName, fileContent, { contentType: 'audio/mpeg', upsert: true });

        if (uploadError) {
            console.error(`   ❌ Upload failed: ${uploadError.message}`);
            try { fs.unlinkSync(localPath); } catch (e) { }
            return;
        }

        const { data } = dbService.supabase.storage.from('clips').getPublicUrl(fileName);
        const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

        // Cleanup local file
        try { fs.unlinkSync(localPath); } catch (e) { }

        console.log(`   ✅ Success! URL: ${publicUrl}`);
        console.log(`   📝 Captions: ${captions.length} chunks`);

        // 4. Update DB
        const updates = {};
        if (table === 'aggregated_stories') {
            updates.podcast_audio_path = publicUrl;
            updates.podcast_captions = captions;
        } else {
            updates["podcastAudioPath"] = publicUrl;
            updates.caption_data = captions;
        }

        // Clear legacy columns
        updates.titleAudioPath = null;
        updates.descriptionAudioPath = null;
        updates.claimAudioPath = null;

        const { error: updateError } = await dbService.supabase
            .from(table)
            .update(updates)
            .eq('id', item.id);

        if (updateError) {
            console.error(`   ❌ DB Update failed: ${updateError.message}`);
        } else {
            console.log(`   💾 Database updated`);
        }

    } catch (err) {
        console.error(`   ❌ Critical error processing item ${item.id}:`, err);
    }
}

regenerateAllTTS();
