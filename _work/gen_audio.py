import asyncio, os
from emergentintegrations.llm.openai.text_to_speech import OpenAITextToSpeech

KEY = "sk-emergent-f8dE5E156F107E53bA"
OUT = "/app/frontend/assets/audio"
os.makedirs(OUT, exist_ok=True)

LINES = {
    "mission_intro": "Alright explorer. Your next mission starts now. Eyes open.",
    "success": "That counts! Nice work. Let's make the next one harder.",
    "failure": "Hmm, nice try. I don't think that's quite what I was looking for.",
    "adventure_complete": "You did it! Three missions complete. Not bad, detective.",
}

async def main():
    tts = OpenAITextToSpeech(api_key=KEY)
    for name, text in LINES.items():
        try:
            audio = await tts.generate_speech(text=text, model="tts-1", voice="fable", speed=1.08, response_format="mp3")
            path = os.path.join(OUT, f"{name}.mp3")
            with open(path, "wb") as f:
                f.write(audio)
            print("OK", name, len(audio), "bytes")
        except Exception as e:
            print("FAIL", name, repr(e))

asyncio.run(main())
