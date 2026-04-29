from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import edge_tts
import asyncio
import os
import tempfile
import subprocess

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Default voice - sounds similar to OpenAI's "alloy"
# Other good options: en-US-AriaNeural, en-US-GuyNeural, en-GB-SoniaNeural
DEFAULT_VOICE = "en-US-JennyNeural"

print(f"Edge-TTS service starting with voice: {DEFAULT_VOICE}")

# async def generate_audio(text, voice, speed): --> Removed async
def generate_audio_with_marks(text, voice, speed):
    """Generate audio and capture word timestamps using edge-tts library"""

    # Speed string for edge-tts
    rate_str = f"+{int((speed - 1) * 100)}%" if speed >= 1 else f"{int((speed - 1) * 100)}%"

    audio_data = bytearray()
    marks = []

    async def _run():
        communicate = edge_tts.Communicate(text, voice, rate=rate_str)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.extend(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                marks.append({
                    "word": chunk["text"],
                    "offset": chunk["offset"],   # 100ns units
                    "duration": chunk["duration"] # 100ns units
                })

    try:
        # Run async function in a new loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_run())
        loop.close()

        return bytes(audio_data), marks
    except Exception as e:
        print(f"Error in edge-tts generation: {e}")
        raise e

def generate_audio_sync(text, voice, speed):
    """Generate audio synchronously and return path to temporary file"""
    audio_bytes, _ = generate_audio_with_marks(text, voice, speed)

    # Save to temporary file
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(audio_bytes)
        temp_path = f.name

    return temp_path

@app.route('/generate', methods=['POST'])
def generate_speech():
    # Helper to maintain backward compatibility but use new engine
    data = request.json
    text = data.get('text')
    speed = data.get('speed', 1.0)
    voice = data.get('voice', DEFAULT_VOICE)
    
    if not text:
        return jsonify({"error": "No text provided"}), 400

    print(f"Generating speech for: {text[:50]}... (speed={speed})", flush=True)

    try:
        # Use new library-based generation
        audio_bytes, _ = generate_audio_with_marks(text, voice, speed)
        
        # Write to temp file to send (Flask send_file expects file or BytesIO)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name
            
        # Return the file
        response = send_file(temp_path, mimetype="audio/mpeg")
        
        @response.call_on_close
        def cleanup():
            try: os.unlink(temp_path)
            except: pass
        
        return response

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Generation error: {e}", flush=True)
        return jsonify({"error": str(e), "traceback": error_details}), 500

@app.route('/generate-with-marks', methods=['POST'])
def generate_speech_with_marks():
    """Generates audio and returns JSON with base64 audio and timestamps"""
    data = request.json
    text = data.get('text')
    speed = data.get('speed', 1.0)
    voice = data.get('voice', DEFAULT_VOICE)
    
    if not text:
        return jsonify({"error": "No text provided"}), 400

    print(f"Generating speech + marks for: {text[:50]}...", flush=True)

    try:
        audio_bytes, marks = generate_audio_with_marks(text, voice, speed)
        
        # Convert to base64
        import base64
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return jsonify({
            "audio": audio_b64,
            "marks": marks
        })

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Generation error: {e}", flush=True)
        return jsonify({"error": str(e), "traceback": error_details}), 500

@app.route('/generate-dialogue', methods=['POST'])
def generate_dialogue():
    """
    Generate a podcast-style dialogue with multiple speakers.
    Input: { "dialogue": [ {"speaker": "Sarah", "text": "..."}, {"speaker": "Mike", "text": "..."} ] }
    """
    data = request.json
    dialogue = data.get('dialogue') # Array of {speaker, text}
    
    if not dialogue or not isinstance(dialogue, list):
        return jsonify({"error": "Invalid dialogue format. Expected list of {speaker, text}"}), 400

    print(f"🎙️ Generating Podcast with {len(dialogue)} segments...", flush=True)

    import re
    # Voice Mapping - Case insensitive keys
    VOICE_MAP = {
        "sarah": "en-US-AriaNeural", 
        "mike": "en-US-GuyNeural" # Guy is a very standard, distinct male news voice
    }

    try:
        temp_files = []
        
        # 1. Generate each segment
        for i, turn in enumerate(dialogue):
            speaker_name = str(turn.get('speaker', 'Sarah')).strip()
            text = str(turn.get('text', '')).strip()
            if not text: continue
            
            # Robust Sanitization: Remove ALL variations of "Sarah: ", "**Sarah:**", "[Sarah]", "(Sarah)", "Speaker: Sarah", etc.
            # We loop until the text stops changing to handle nested prefixes (e.g. "Speaker: Sarah: Hello")
            
            sanitization_patterns = [
                rf"^{re.escape(speaker_name)}\s*:\s*",              # "Sarah: "
                rf"^\*\*{re.escape(speaker_name)}\*\*[\s:]*",      # "**Sarah:** "
                rf"^\[{re.escape(speaker_name)}\][\s:]*",          # "[Sarah] "
                rf"^\({re.escape(speaker_name)}\)[\s:]*",          # "(Sarah) "
                r"^Speaker\s*:\s*",                                # "Speaker: "
                r"^Host\s*:\s*",                                   # "Host: "
                r"^[A-Z][a-z]+\s*:\s*"                             # Any capitalized name followed by colon
            ]
            
            cleaned = True
            while cleaned:
                cleaned = False
                for pattern in sanitization_patterns:
                    new_text = re.sub(pattern, "", text, flags=re.IGNORECASE).strip()
                    if new_text != text:
                        text = new_text
                        cleaned = True
                        break # Restart the loop with the new text to ensure strict ordering isn't an issue

            voice = VOICE_MAP.get(speaker_name.lower(), DEFAULT_VOICE)
            
            # Print EXACTLY what is being sent to the TTS engine
            print(f"   [{i+1}/{len(dialogue)}] 🎙️ SPEAKING: [{speaker_name}] via [{voice}]", flush=True)
            print(f"   RAW TEXT: \"{text}\"", flush=True)
            
            # Use the existing generate_audio function
            seg_path = generate_audio_sync(text, voice, speed=1.15)
            temp_files.append(seg_path)

        if not temp_files:
             return jsonify({"error": "No audio generated"}), 500

        # 2. Stitch them together using ffmpeg
        # We can use the "concat" demuxer or just binary concatenation for MP3 (mostly works but frame headers might be slightly glitchy on some players).
        # Better: use ffmpeg concat filter.
        
        # Create a list file for ffmpeg
        list_file_path = tempfile.mktemp(suffix=".txt")
        with open(list_file_path, 'w') as f:
            for path in temp_files:
                # ffmpeg requires absolute paths and safe quoting
                safe_path = path.replace("'", "'\\''") 
                f.write(f"file '{safe_path}'\n")
        
        output_path = tempfile.mktemp(suffix=".mp3")
        
        # Run ffmpeg
        # -f concat -safe 0 -i list.txt -c:a libmp3lame -ar 44100 -ac 2 output.mp3 (Re-encode for consistency)
        import subprocess
        cmd = f"ffmpeg -f concat -safe 0 -i \"{list_file_path}\" -c:a libmp3lame -ar 44100 -ac 2 \"{output_path}\" -y"
        
        # Check if ffmpeg is installed. If not, fallback to binary concat (risky but works usually)
        if os.system("which ffmpeg > /dev/null 2>&1") == 0:
             subprocess.call(cmd, shell=True)
        else:
             print("⚠️ FFmpeg not found. Falling back to binary concatenation.", flush=True)
             with open(output_path, 'wb') as outfile:
                 for path in temp_files:
                     with open(path, 'rb') as infile:
                         outfile.write(infile.read())

        # 3. Cleanup temp segments
        for p in temp_files:
             try: os.unlink(p)
             except: pass
        if os.path.exists(list_file_path): os.unlink(list_file_path)

        # 4. Return result
        response = send_file(output_path, mimetype="audio/mpeg")
        
        @response.call_on_close
        def cleanup_final():
            try: os.unlink(output_path)
            except: pass
        
        return response

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Podcast Generation error: {e}", flush=True)
        return jsonify({"error": str(e), "traceback": error_details}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "engine": "edge-tts", "voice": DEFAULT_VOICE})

@app.route('/voices', methods=['GET'])
def list_voices():
    """List available voices"""
    async def get_voices():
        voices = await edge_tts.list_voices()
        return [v for v in voices if v['Locale'].startswith('en')]
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    voices = loop.run_until_complete(get_voices())
    loop.close()
    
    return jsonify(voices)

if __name__ == '__main__':
    print(f"Edge-TTS service starting with voice: {DEFAULT_VOICE}", flush=True)
    port = int(os.environ.get('TTS_PORT', 5001))
    app.run(host='0.0.0.0', port=port)
