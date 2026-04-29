const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dbService = require('./dbService');

const CLIPS_DIR = process.env.CLIPS_DIR || './clips';
const MAX_CLIP_DURATION = parseInt(process.env.MAX_CLIP_DURATION) || 60;

class ClipService {
    /**
     * Create a video clip from a source video
     * @param {string} videoPath - Path to source video
     * @param {number} startTime - Start time in seconds
     * @param {number} duration - Duration in seconds
     * @param {string} newsId - Associated news item ID
     * @returns {Promise<Object>} - Clip metadata
     */
    async createClip(videoPath, startTime, duration, newsId) {
        try {
            // Validate inputs
            if (duration > MAX_CLIP_DURATION) {
                throw new Error(`Clip duration cannot exceed ${MAX_CLIP_DURATION} seconds`);
            }

            if (startTime < 0 || duration <= 0) {
                throw new Error('Invalid start time or duration');
            }

            // Ensure clips directory exists
            if (!fs.existsSync(CLIPS_DIR)) {
                fs.mkdirSync(CLIPS_DIR, { recursive: true });
            }

            const clipId = uuidv4();
            const outputFilename = `${clipId}.mp4`;
            const outputPath = path.join(CLIPS_DIR, outputFilename);
            const thumbnailFilename = `${clipId}-thumb.jpg`;
            const thumbnailPath = path.join(CLIPS_DIR, thumbnailFilename);

            console.log(`✂️ Creating clip: ${outputFilename}`);
            console.log(`   Start: ${startTime}s, Duration: ${duration}s`);

            // Create the clip using FFmpeg
            await this._generateClip(videoPath, outputPath, startTime, duration);

            // Generate thumbnail
            await this._generateThumbnail(outputPath, thumbnailPath, startTime + duration / 2);

            // Get file size
            const stats = fs.statSync(outputPath);
            const fileSizeInBytes = stats.size;

            // Upload to Supabase Storage
            let publicClipUrl = `${process.env.BASE_URL}/api/clips/${outputFilename}`;
            let publicThumbUrl = `${process.env.BASE_URL}/api/clips/${thumbnailFilename}`;

            if (dbService.supabase) {
                console.log(`☁️ Uploading clip and thumbnail to Supabase Storage...`);

                // Use stream instead of buffer to save memory (OOM Prevention)
                const videoStream = fs.createReadStream(outputPath);
                const { error: videoError } = await dbService.supabase.storage
                    .from('clips')
                    .upload(outputFilename, videoStream, {
                        contentType: 'video/mp4',
                        duplex: 'half',
                        upsert: true
                    });

                if (videoError) {
                    console.error('❌ Failed to upload video to Supabase:', videoError.message);
                } else {
                    const { data: videoData } = dbService.supabase.storage
                        .from('clips')
                        .getPublicUrl(outputFilename);
                    publicClipUrl = videoData.publicUrl;
                    console.log('✅ Video uploaded:', publicClipUrl);
                }

                // Upload Thumbnail
                if (fs.existsSync(thumbnailPath)) {
                    const thumbBuffer = fs.readFileSync(thumbnailPath);
                    const { error: thumbError } = await dbService.supabase.storage
                        .from('clips')
                        .upload(thumbnailFilename, thumbBuffer, {
                            contentType: 'image/jpeg',
                            upsert: true
                        });

                    if (!thumbError) {
                        const { data: thumbData } = dbService.supabase.storage
                            .from('clips')
                            .getPublicUrl(thumbnailFilename);
                        publicThumbUrl = thumbData.publicUrl;
                    }
                }
            } else {
                console.warn('⚠️ Supabase not initialized, skipping upload. Using local URLs.');
            }

            const clipMetadata = {
                clipId,
                newsId,
                clipUrl: publicClipUrl,
                thumbnailUrl: publicThumbUrl,
                duration,
                startTime,
                fileSize: fileSizeInBytes,
                createdAt: new Date().toISOString()
            };

            // Save metadata
            const metadataPath = path.join(CLIPS_DIR, `${clipId}.json`);
            fs.writeFileSync(metadataPath, JSON.stringify(clipMetadata, null, 2));

            console.log(`✅ Clip created and metadata saved: ${clipId}`);

            // Clean up local media files if upload was effective (URLs are remote)
            if (publicClipUrl.startsWith('http')) {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                    console.log(`   🧹 Cleaned up local video: ${outputFilename}`);
                }
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                    console.log(`   🧹 Cleaned up local thumbnail: ${thumbnailFilename}`);
                }
            }

            return clipMetadata;

        } catch (error) {
            console.error(`❌ Clip creation failed: ${error.message}`);
            throw new Error(`Failed to create clip: ${error.message}`);
        }
    }

    /**
     * Generate clip using FFmpeg
     * @private
     */
    _generateClip(inputPath, outputPath, startTime, duration) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(startTime)
                .setDuration(duration)
                .outputOptions([
                    '-vf scale=-2:720',      // Scale to 720p (HD)
                    '-c:v libx264',           // Video codec
                    '-preset fast',           // Good compromise between speed and compression
                    '-crf 24',                // Higher quality (lower is better, 23-28 is standard)
                    '-c:a aac',               // Audio codec
                    '-b:a 128k',              // Audio bitrate
                    '-movflags +faststart',   // Enable streaming
                    '-y'                      // Overwrite output
                ])
                .output(outputPath)
                .on('start', (cmd) => {
                    console.log('FFmpeg command:', cmd);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`Processing: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', () => {
                    console.log('✅ FFmpeg processing complete');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ FFmpeg error:', err.message);
                    reject(err);
                })
                .run();
        });
    }

    /**
     * Generate thumbnail from video
     * @private
     */
    _generateThumbnail(videoPath, thumbnailPath, timeInSeconds) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [timeInSeconds],
                    filename: path.basename(thumbnailPath),
                    folder: path.dirname(thumbnailPath),
                    size: '720x?'
                })
                .on('end', () => {
                    console.log('✅ Thumbnail generated');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ Thumbnail generation error:', err.message);
                    // Don't reject - thumbnail is optional
                    resolve();
                });
        });
    }

    /**
     * Get clip metadata
     * @param {string} clipId - Clip UUID
     * @returns {Object} - Clip metadata
     */
    getClipMetadata(clipId) {
        const metadataPath = path.join(CLIPS_DIR, `${clipId}.json`);

        if (!fs.existsSync(metadataPath)) {
            throw new Error('Clip not found');
        }

        return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }

    /**
     * Delete a clip and its associated files
     * @param {string} clipId - Clip UUID
     */
    deleteClip(clipId) {
        try {
            const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);
            const thumbnailPath = path.join(CLIPS_DIR, `${clipId}-thumb.jpg`);
            const metadataPath = path.join(CLIPS_DIR, `${clipId}.json`);

            [clipPath, thumbnailPath, metadataPath].forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            console.log(`🗑️ Deleted clip: ${clipId}`);
        } catch (error) {
            console.error(`❌ Failed to delete clip: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ClipService();
