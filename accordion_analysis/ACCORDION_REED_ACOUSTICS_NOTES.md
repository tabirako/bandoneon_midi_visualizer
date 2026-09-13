# Accordion reed acoustics — field notes

General-purpose findings from analyzing a real Italian Serenellini accordion
(and cross-checked against a bandoneon) for the bandoneon-midi-visualizer
project. Written to be reusable on a *different* accordion project, not
specific to this app's code — see `accordion_analysis/` in this repo for the
scripts, raw measurements, and plots these are based on, if useful as a
starting point.

## 1. Bass reeds can have a weaker fundamental than their own harmonics

At the bottom of a reed rank's range, the fundamental partial can measure
*quieter* than several of its own upper harmonics — one recording showed a
9th harmonic +15.36dB louder than the fundamental (see
`plot_lowF3_weak_fundamental.png`). This is a real acoustic property, not
noise: low reeds are less efficient at radiating their own fundamental
frequency than their higher partials.

**Implication for pitch-detection code**: "find the tallest peak in the
spectrum" will confidently pick the wrong octave. Fixes that worked:
- Autocorrelation-based pitch (time-domain periodicity) is far more robust
  to a weak/missing fundamental than picking the loudest spectral peak,
  since it tracks the true repetition rate regardless of which partial is
  loudest.
- Autocorrelation has its own failure mode at very high pitches (can lock
  onto a subharmonic) — cross-checking against a narrow spectral-peak
  search resolves most remaining ambiguity.
- Even then, a specific check helps: after picking a fundamental, check for
  a real peak at exactly half that frequency; if it's within ~6dB of the
  chosen "fundamental," the true fundamental is almost certainly the lower
  one and the algorithm latched onto a strong 2nd harmonic instead.

## 2. Registers/stops can be exact octave multiples of the pressed key

On this instrument, the three switchable reed ranks measured as *exactly*
0.5x / 1x / 2x the pressed key's frequency across the whole tested range
(low = octave down, mid = unison, high = octave up) — a real, physical
16'/8'/4' organ-stop-style design. This was independently confirmed by two
different pitch-detection methods agreeing on 19/21 test recordings.

Don't assume this generalizes to every accordion (registration schemes
vary), but it's a real, testable design some instruments use, and the
octave-multiple structure is easy to verify: search for spectral peaks near
key_freq × {0.5, 1, 2, 4} and see which one is real.

## 3. "Wet"/musette tuning is NOT a constant cents offset across the keyboard

The measured cents-offset of a detuned "wet" reed pair shrinks dramatically
as pitch rises — e.g. ~21-22 cents at F3/C4 shrinking to ~5 cents at A6 on
this instrument, a pattern that showed up **independently three separate
times** across different recording sessions and different reed
combinations. The likely explanation: reed tuners often work by ear to a
roughly *constant perceived beat rate* (a consistent "shimmer speed" in Hz),
not a constant musical interval — and the same absolute Hz gap is a much
bigger fraction of a low note's frequency than a high note's.

**Implication**: if modeling a "wet" voice, a single fixed cents value
across the whole keyboard is a simplification. A more authentic model
scales detune roughly inversely with frequency (closer to a constant beat
rate in Hz), not constant cents.

## 4. Multiple simultaneous reeds don't behave like simple symmetric superposition

A 3-reed "musette" chord (dry M + two detuned partners M-/M+) is NOT
generally sin(x) + sin((1+d)x) + sin((1-d)x) (i.e. two reeds symmetrically
detuned around the dry center). Measured beat components were **stable but
not related by a clean 2x ratio** (3.13Hz and 4.84Hz on one note, ratio
1.55 not 2.0) — meaning the two "wet" reeds are asymmetrically offset from
center, not mirror images of each other. This produces an envelope that's
qualitatively more complex than the clean, simply-periodic pattern a
symmetric model predicts (compare `plot_musette_ideal_vs_real.png`'s two
panels) even though nothing is actually unstable or random — confirmed by
splitting a long held note in half and finding the *same* two frequencies
present in both halves.

**Implication for synthesis**: an additive/oscillator model using
perfectly-symmetric ±detune for a wet voice will sound too clean/simple
compared to a real instrument. Using independently-chosen (not mirrored)
offsets for each detuned reed gets closer to how a real multi-reed chorus
actually sounds.

## 5. Recording gain doesn't corrupt relative-harmonic measurements, but does affect noise floor

An audio interface's input gain is a flat multiplier across the whole
spectrum — it shifts every harmonic (fundamental included) by the same dB
amount, so it cancels out completely in any measurement expressed relative
to a recording's own fundamental (e.g. "harmonic 2 is +6dB vs harmonic 1").
A gain slip between takes does NOT invalidate timbre/brightness
comparisons done this way.

It does, however, mean **absolute level (`rms_db`) can't be trusted as a
proxy for playing dynamics** if gain wasn't held constant across takes —
and very quiet takes (low gain, or genuinely soft playing) have worse
signal-to-noise ratio on their smallest harmonics regardless of the reason
they're quiet.

## 6. Real bellows/breath dynamics are hard to hold consistent — expect it

Even a deliberately careful player produced a real ~9-10dB spread in
recording level across a set of "same dynamic" notes spanning ~3.5 octaves,
and a retake didn't reliably improve on the first attempt. This isn't a
mistake to chase perfection on — bellows instruments give continuous,
whole-body control over air pressure with no fixed "key velocity" reference
the way a piano does. Budget for natural variance rather than expecting
piano-like repeatability.

## 7. Methodology: what it takes to measure a slow beat/vibrato reliably

- Frequency resolution is fundamentally limited by observation *duration*
  (resolution ≈ 1/seconds), independent of sample rate — a 1-second note
  cannot resolve a sub-1Hz beat precisely no matter how it's processed.
  **Hold notes 5-10+ seconds** for a beat/vibrato measurement to be trusted;
  shorter is fine for pitch and harmonic-content analysis, not for this.
- Record **one note per file**, not a passage/scale — auto-segmenting a
  continuous performance by amplitude envelope is workable but error-prone
  (can miscount or mis-split notes), and costs you duration per note either
  way.
- When measuring a beat's rate for conversion to "cents of detune," get the
  physics right: for two tones summed together, the *measured envelope
  beat frequency equals the full difference between them*, not half — only
  divide by 2 if you're deliberately computing a symmetric per-side offset
  from an assumed shared center, and only if that assumption is actually
  true for what you're measuring (see point 4: sometimes it isn't).
