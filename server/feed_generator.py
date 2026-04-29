import json
import urllib.request
import urllib.parse
import re
import time
import os
import sys
from datetime import datetime

# Configuration
NEWS_API_KEY = os.getenv('NEWS_API_KEYS')
if not NEWS_API_KEY:
    print("❌ ERROR: NEWS_API_KEYS environment variable is required")
    print("Please set it in your .env file or export it before running this script")
    sys.exit(1)

NEWS_URL = f"https://api.thenewsapi.com/v1/news/all?api_token={NEWS_API_KEY}&limit=50&language=en"
OUTPUT_FILE = "feed.json"

def fetch_news(page=1):
    url = f"{NEWS_URL}&page={page}"
    print(f"📡 Fetching news from {url}...")
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get('data', [])
    except Exception as e:
        print(f"❌ Error fetching news page {page}: {e}")
        return []

def search_youtube(query):
    # minimal search to get the first video ID
    # Query: Title + " news"
    search_query = urllib.parse.quote(query + " news")
    url = f"https://www.youtube.com/results?search_query={search_query}"
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode()
            # Regex to find video IDs (videoId":"V1D30-1D")
            video_ids = re.findall(r'"videoId":"(.*?)"', html)
            if video_ids:
                # Filter out likely ads or playlists if possible, usually first one is good
                return video_ids[0]
    except Exception as e:
        print(f"⚠️ Error searching YouTube for '{query}': {e}")
    
    return None

def main():
    print("🚀 Starting Feed Generator with Pagination...")
    all_articles = []
    seen_ids = set()

    # Fetch 20 pages
    for page in range(1, 21):
        articles = fetch_news(page)
        if not articles:
            print("⚠️ No more articles found or error occurred.")
            break
            
        for article in articles:
            uuid = article.get('uuid')
            if uuid not in seen_ids:
                all_articles.append(article)
                seen_ids.add(uuid)
        
        print(f"✅ Page {page}: Found {len(articles)} items. Total unique: {len(all_articles)}")
        time.sleep(1) # Be nice to API

    print(f"✅ Total articles collected: {len(all_articles)}")
    
    processed_feed = []
    
    for article in all_articles:
        title = article.get('title', 'No Title')
        image_url = article.get('image_url')
        description = article.get('description') or article.get('snippet')
        
        # Strict Filtering
        if not image_url:
            print(f"⏭️  Skipping (No Image): {title[:30]}...")
            continue
            
        if not description or len(description) < 20:
            print(f"⏭️  Skipping (Bad Summary): {title[:30]}...")
            continue
            
        print(f"🔍 Processing: {title}")
        
        # simulated AI processing (just clean up title or description if needed)
        # For now, just find the video
        video_id = search_youtube(title)
        
        if not video_id:
             print(f"   ⏭️ Skipping (No Video Found)")
             continue

        print(f"   🎥 Found Video: {video_id}")
            
        processed_item = {
            "id": article.get('uuid'),
            "title": title,
            "summary": [description],
            "imageURL": image_url,
            "sourceAPI": article.get('source'),
            "date": article.get('published_at'),
            "category": "Current", # Default
            "youtubeID": video_id, # Video ID for clip
            "articleURL": article.get('url')  # Direct link to article
        }
        processed_feed.append(processed_item)
        
        # Be nice to YouTube
        time.sleep(1)

    # Save to JSON
    with open(OUTPUT_FILE, 'w') as f:
        json.dump({"data": processed_feed}, f, indent=4)
        
    print(f"\n✅ Saved {len(processed_feed)} items to {OUTPUT_FILE}")
    print("\nTo serve this feed, run:")
    print("python3 -m http.server 8080")

if __name__ == "__main__":
    main()
