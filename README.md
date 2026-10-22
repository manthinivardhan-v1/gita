# VISHWAROOP — The Cosmic Gita

A psychedelic, cosmic journey through all 700 ślokas of the **Bhagavad Gita**, Krishna's song to Arjuna on the field of Kurukshetra, ending in the vision of the **Vishwaroop** (the Universal Form, Chapter 11).

- **All 701 verses** (Sanskrit, transliteration, English by Shri Purohit Swami, Hindi by Swami Tejomayananda), plus a narrated prologue and epilogue
- **Live WebGL cosmos**: domain-warped nebulae, hyperspace starfields, and kaleidoscopic KIFS mandalas whose colours follow whoever is speaking
- **The Vishwaroop**: a many-headed, many-armed blue cosmic body full of galaxies, with a thousand blinking eyes, a thousand suns (11.12) and the fiery mouths of Kāla (11.32)
- **Generated cosmic sound**: a 136.1 Hz Om drone, tanpura, theta binaural beats, singing bowls, a conch, Krishna's bansuri and a cosmic choir
- **Divine narration**: every verse is pre-recorded in English, Hindi and Sanskrit (`audio/`). Each character has their own voice: Krishna deep and unhurried with a temple echo, Arjuna younger and brighter, Sanjaya the narrator. English words light up as they're spoken, and the cosmos pulses with the voice. The device's own voice is a fallback.
- **Three intensities**: Gentle, Cosmic, and Transcendent (⚠ strobe and flashing image blocks). Press `Esc` at any time to calm the visuals.

## Deploy
Plain static site with no build step. Import this repo in Vercel (Framework preset: **Other**) and deploy.

Local preview: `python3 -m http.server` and open http://localhost:8000

## Controls
`Space` play/pause · `←/→` verse · `↑/↓` chapter · `C` chapters · `V` Vishwaroop · `W` word meanings · `M` mute · `F` fullscreen · `Esc` calm

## Voices
Narration was generated with [Piper](https://github.com/rhasspy/piper) neural TTS using `tools/generate_voices.py`:
- `hi_IN-pratham-medium` (Hindi and Sanskrit): CC BY-NC-SA 4.0
- `en_GB-northern_english_male-medium` (English, Krishna and Dhritarashtra): CC BY-SA 4.0
- `en_US-ryan-high` (English, Arjuna and Sanjaya): CC BY-NC-SA 4.0

Because of the NC (non-commercial) licenses, keep this project non-commercial or swap in commercially licensed voices before monetising it.
To re-generate: `pip install piper-tts`, download the voices from huggingface.co/rhasspy/piper-voices, then run `python tools/generate_voices.py --voices <dir>`.

Verse data from the open [gita/gita](https://github.com/gita/gita) dataset.
