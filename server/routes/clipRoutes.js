const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const youtubeService = require('../services/youtubeService');
const clipService = require('../services/clipService');

const CLIPS_DIR = process.env.CLIPS_DIR || './clips';

/**
 * POST /api/clips/generate
 * Generate a clip from a YouTube video
 */
router.post('/generate', async (req, res, next) => {
    try {
        const { videoId, startTime, duration, newsId } = req.body;

        // Validate request
        if (!videoId) {
            return res.status(400).json({ error: 'videoId is required' });
        }

        if (startTime === undefined || duration === undefined) {
            return res.status(400).json({ error: 'startTime and duration are required' });
        }

        console.log(`\n🎬 Clip generation request:`);
        console.log(`   Video ID: ${videoId}`);
        console.log(`   Start: ${startTime}s, Duration: ${duration}s`);
        console.log(`   News ID: ${newsId || 'N/A'}`);

        // Step 1: Download YouTube video
        const videoPath = await youtubeService.downloadVideo(videoId);

        // Step 2: Create clip
        const clipMetadata = await clipService.createClip(
            videoPath,
            parseFloat(startTime),
            parseFloat(duration),
            newsId
        );

        res.status(201).json({
            success: true,
            clip: clipMetadata
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/clips/:filename
 * Serve a clip file (video or thumbnail)
 */
router.get('/:filename', (req, res, next) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(CLIPS_DIR, filename);

        // Security check: prevent directory traversal
        const resolvedPath = path.resolve(filePath);
        const resolvedClipsDir = path.resolve(CLIPS_DIR);

        if (!resolvedPath.startsWith(resolvedClipsDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Determine content type
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';

        if (ext === '.mp4') {
            contentType = 'video/mp4';
        } else if (ext === '.jpg' || ext === '.jpeg') {
            contentType = 'image/jpeg';
        } else if (ext === '.json') {
            contentType = 'application/json';
        }

        // Get file stats for range requests (important for video streaming)
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // Handle range requests for video streaming
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType,
            });

            const stream = fs.createReadStream(filePath, { start, end });
            stream.pipe(res);
        } else {
            // Serve entire file
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes'
            });

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        }

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/clips/:clipId/metadata
 * Get clip metadata as JSON
 */
router.get('/:clipId/metadata', (req, res, next) => {
    try {
        const { clipId } = req.params;
        const metadata = clipService.getClipMetadata(clipId);
        res.json(metadata);
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/clips/:clipId
 * Delete a clip
 */
router.delete('/:clipId', (req, res, next) => {
    try {
        const { clipId } = req.params;
        clipService.deleteClip(clipId);
        res.json({ success: true, message: 'Clip deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
