import asyncio
import edge_tts
import os
import sys

async def test_tts():
    text = "This is a diagnostic test of the text to speech system."
    voice = "en-US-JennyNeural"
    output_file = "diag_test.mp3"
    
    print(f"Testing edge-tts with voice: {voice}")
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
        if os.path.exists(output_file):
            print(f"✅ Success! Audio saved to {output_file}")
            print(f"File size: {os.path.getsize(output_file)} bytes")
            # Clean up
            os.remove(output_file)
        else:
            print("❌ Failure: Output file not created.")
    except Exception as e:
        print(f"❌ Error during TTS generation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tts())
