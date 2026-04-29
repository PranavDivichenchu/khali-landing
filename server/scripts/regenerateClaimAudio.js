/**
 * Script to regenerate claim audio for existing articles
 * Run with: node scripts/regenerateClaimAudio.js
 */

require('dotenv').config();
const dbService = require('../services/dbService');
const aiService = require('../services/aiService');
const fs = require('fs');
const path = require('path');

async function regenerateClaimAudio() {
    console.log('🔄 Starting claim audio regeneration...\n');

    try {
        // Get all articles with clips that are missing claim audio
        const { data: articles, error } = await dbService.supabase
            .from('news_items')
            .select('id, title, claims, "claimAudioPath"')
            .eq('status', 'CLIP_READY')
            .is('claimAudioPath', null);

        if (error) {
            console.error('❌ Failed to fetch articles:', error.message);
            return;
        }

        console.log(`📰 Found ${articles.length} articles missing claim audio\n`);

        let processed = 0;
        let skipped = 0;

        for (const article of articles) {
            // Skip if no claims
            if (!article.claims || article.claims.length === 0) {
                console.log(`⏭️ Skipping ${article.id} - no claims`);
                skipped++;
                continue;
            }

            const claimText = article.claims[0];
            console.log(`\n🎤 Processing: "${article.title.substring(0, 50)}..."`);
            console.log(`   Claim: "${claimText}"`);

            try {
                // Generate TTS for claim
                const claimAudio = await aiService.generateSpeech(claimText);
                const claimFilename = `${article.id}_claim.mp3`;

                // Ensure temp directory exists
                const tempDir = path.join(__dirname, '../public/audio');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                const tempPath = path.join(tempDir, claimFilename);

                // Save temporarily
                fs.writeFileSync(tempPath, claimAudio);
                console.log(`   [TTS] Generated: ${claimFilename}`);

                // Upload to Supabase
                const { error: uploadError } = await dbService.supabase.storage
                    .from('clips')
                    .upload(claimFilename, claimAudio, {
                        contentType: 'audio/mpeg',
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`   ❌ Upload failed: ${uploadError.message}`);
                    continue;
                }

                // Get public URL
                const { data: urlData } = dbService.supabase.storage
                    .from('clips')
                    .getPublicUrl(claimFilename);

                // Update database
                await dbService.updateItem(article.id, {
                    claimAudioPath: urlData.publicUrl
                });

                console.log(`   ✅ Uploaded: ${urlData.publicUrl}`);

                // Cleanup temp file
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

                processed++;

                // Rate limit - wait 1 second between API calls
                await new Promise(r => setTimeout(r, 1000));

            } catch (err) {
                console.error(`   ❌ Error processing ${article.id}:`, err.message);
            }
        }

        console.log(`\n✅ Done! Processed: ${processed}, Skipped: ${skipped}`);

    } catch (err) {
        console.error('❌ Script error:', err);
    }

    process.exit(0);
}

regenerateClaimAudio();
