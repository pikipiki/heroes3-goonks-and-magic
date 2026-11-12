# Browser tests

Run every end-to-end test silently by default, as requested by the owner.
Call `silenceTestAudio(page)` from `silent-audio.mjs` before navigating each new page.
Keep the audio engine running for functional audio assertions; mute its final output
rather than changing the player's saved settings. Only enable audible output when
explicitly requested by the owner.
