const { exec } = require('child_process');

function checkFFmpeg() {
    return new Promise((resolve, reject) => {
        exec('ffmpeg -version', (error, stdout, stderr) => {
            if (error) {
                reject(new Error('FFmpeg is not installed. Please install FFmpeg to use this server.'));
            } else {
                console.log('✅ FFmpeg detected:', stdout.split('\n')[0]);
                resolve(true);
            }
        });
    });
}

module.exports = { checkFFmpeg };
