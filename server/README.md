# Video Clip Server

Node.js server for generating video clips from YouTube videos for the Khali iOS app.

## Features

- 📥 Download YouTube videos
- ✂️ Generate clips with FFmpeg
- 🎬 Serve clips via REST API
- 🖼️ Automatic thumbnail generation
- 📱 iOS-compatible video streaming (range requests)

## Prerequisites

- **Node.js** 16+ 
- **FFmpeg** installed on your system
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt-get install ffmpeg`

## Installation

```bash
# Install dependencies
npm install

# Configure environment (optional - defaults work)
cp .env.example .env
```

## Usage

```bash
# Start server
npm start

# Development mode (auto-restart)
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### Generate Clip
```bash
POST /api/clips/generate
Content-Type: application/json

{
  "videoId": "C3JoiuYb3uQ",
  "startTime": 10,
  "duration": 15,
  "newsId": "optional-news-id"
}
```

### Get Clip
```bash
GET /api/clips/{clipId}.mp4
```

### Get News Feed
```bash
GET /api/news/feed
```

## Example

```bash
# Generate a 15-second clip starting at 10 seconds
curl -X POST http://localhost:3000/api/clips/generate \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "C3JoiuYb3uQ",
    "startTime": 10,
    "duration": 15,
    "newsId": "a42312fe-273f-47ed-9ff7-94c20d5c823a"
  }'

# Play the clip
# Response will include clipUrl - open in browser or video player
```

## Directory Structure

```
server/
├── clips/           # Generated video clips
├── downloads/       # Cached YouTube videos
├── routes/          # API routes
├── services/        # Business logic
├── middleware/      # Express middleware
└── utils/           # Utilities
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| CLIPS_DIR | ./clips | Clips storage directory |
| DOWNLOADS_DIR | ./downloads | Video downloads directory |
| MAX_CLIP_DURATION | 60 | Maximum clip length (seconds) |
| BASE_URL | http://localhost:3000 | Server base URL |

## Troubleshooting

**"FFmpeg is not installed"**
- Install FFmpeg for your OS (see Prerequisites)

**"Failed to download YouTube video"**
- Check internet connection
- Verify video ID is correct
- Some videos may be region-locked or age-restricted

**Video won't play on iOS**
- Ensure using MP4 format
- Check range request headers are enabled
