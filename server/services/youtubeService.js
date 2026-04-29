const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Python path determination (consistent with server.js)
const PYTHON_PATH = process.env.PYTHON_PATH || 'venv/bin/python3';

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || './downloads';

class YouTubeService {
    /**
     * Download a YouTube video by ID
     * @param {string} videoId - YouTube video ID
     * @returns {Promise<string>} - Path to downloaded video file
     */
    async downloadVideo(videoId) {
        try {
            console.log(`📥 Downloading YouTube video (yt-dlp): ${videoId}...`);

            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const outputPath = path.join(DOWNLOADS_DIR, `${videoId}.mp4`);

            // Check if already downloaded
            if (fs.existsSync(outputPath)) {
                console.log(`✅ Video already exists: ${outputPath}`);
                return outputPath;
            }

            // Ensure downloads directory exists
            if (!fs.existsSync(DOWNLOADS_DIR)) {
                fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
            }

            return new Promise((resolve, reject) => {
                // Construct yt-dlp command
                // Using python -m yt_dlp ensures we use the installed module in the venv
                const args = [
                    '-m', 'yt_dlp',
                    '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b', // Best mp4 video+audio
                    '-o', outputPath,
                    '--no-playlist',
                    videoUrl
                ];

                console.log(`Spawn: ${PYTHON_PATH} ${args.join(' ')}`);

                const ytDlp = spawn(PYTHON_PATH, args);

                // ytDlp.stdout.on('data', (data) => console.log(`[yt-dlp] ${data}`));
                ytDlp.stderr.on('data', (data) => console.error(`[yt-dlp error] ${data}`));

                ytDlp.on('close', (code) => {
                    if (code === 0) {
                        if (fs.existsSync(outputPath)) {
                            console.log(`✅ Download complete: ${outputPath}`);
                            resolve(outputPath);
                        } else {
                            reject(new Error('yt-dlp exited successfully but file not found'));
                        }
                    } else {
                        reject(new Error(`yt-dlp process exited with code ${code}`));
                    }
                });

                ytDlp.on('error', (err) => {
                    reject(new Error(`Failed to start yt-dlp: ${err.message}`));
                });
            });

        } catch (error) {
            console.error(`❌ YouTube download failed: ${error.message}`);
            throw new Error(`Failed to download YouTube video: ${error.message}`);
        }
    }

    /**
     * Get video info without downloading
     * @param {string} videoId - YouTube video ID
     * @returns {Promise<Object>} - Video metadata
     */
    async getVideoInfo(videoId) {
        try {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            return new Promise((resolve, reject) => {
                const args = ['-m', 'yt_dlp', '-J', videoUrl];
                const ytDlp = spawn(PYTHON_PATH, args);

                let stdout = '';

                ytDlp.stdout.on('data', (data) => { stdout += data.toString(); });

                ytDlp.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const info = JSON.parse(stdout);
                            resolve({
                                title: info.title,
                                duration: info.duration,
                                thumbnail: info.thumbnail,
                                author: info.uploader
                            });
                        } catch (e) {
                            reject(new Error('Failed to parse yt-dlp JSON'));
                        }
                    } else {
                        reject(new Error(`yt-dlp exited with code ${code}`));
                    }
                });
            });
        } catch (error) {
            console.error(`❌ Failed to get video info: ${error.message}`);
            throw new Error(`Failed to get video info: ${error.message}`);
        }
    }
}

module.exports = new YouTubeService();
