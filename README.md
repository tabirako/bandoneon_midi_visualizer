# Bandoneon MIDI Visualizer

An interactive single-page tool that shows which bandoneon buttons produce which
notes. Play a connected MIDI keyboard, load a MIDI file, click the on-screen
buttons, or use your computer keyboard, and the matching buttons light up on both
sides of a 142- or 144-tone bandoneon in real time.

**Live:** [https://kei-c.com/bandoneon_midi_visualizer/](https://bandoneon.kei-c.com/)

**Languages:** [English](#english) &middot; [日本語](#日本語) &middot; [中文（繁體）](#中文繁體)

---

## English

### Why I made this

I'm learning the bandoneon, and as a beginner I kept struggling to connect the
note I wanted to play with the button that actually produces it. It's made harder
by the fact that the instrument is bisonoric: every button plays one note when
the bellows open and a different note when they close.

I built this visualizer to make that relationship easy to see. Give it live MIDI
or a MIDI file and it highlights the corresponding buttons on both sides of the
instrument as the music plays. If you don't have a MIDI device, you can trigger
the same buttons from your computer keyboard.

### How to use it

1. **Open the app:** https://kei-c.com/bandoneon_midi_visualizer/
2. **Choose a layout** &mdash; 142-tone (Rheinische) or 144-tone (Einheits)
   &mdash; from the *Layout* menu.
3. **Pick how you want to play:**
   - **MIDI keyboard:** click **Enable MIDI Keyboard** and allow MIDI access when
     the browser asks. The notes you play are highlighted on the bandoneon.
   - **MIDI file:** click **Upload MIDI file**, choose a `.mid` file, then use
     **Play MIDI**, **Stop**, and the **MIDI position** slider to move through it.
   - **Computer keyboard:** press the keys drawn on the buttons. (See
     [Known issues](#known-issues-and-limitations) for the QWERTY caveat.)
   - **Mouse / touch:** click or tap any button on screen to play it. This
     works on both sides and needs no setup.
4. **Set the bellows direction.** Switch direction with the **Bellows** button or
   the **spacebar**. The button shows **V** for open (pull the bellows apart)
   and **⊓** for close (push them together), following the usual notation for
   bellows instruments.
5. **Adjust to taste (optional):**
   - **Instrument** &mdash; synthesized Bandoneon, Accordion, Harmonica, or
     Musette voices, plus plain Sine / Square / Sawtooth / Triangle waveforms.
   - **Volume**, and for the reed voices, **Reed detune**, **Bellows breath**,
     and **Vibrato depth**.
   - **Hint: No hint** hides every note label and key marking on the buttons, for
     practice.
   - **Button color** &mdash; rainbow by octave, piano black/white, or a single
     color.
   - **Language** and **Theme** (Day / Night / follow browser) in the top bar.

### Known issues and limitations

- **Computer-keyboard hints assume a QWERTY layout.** Key matching is by physical
  key position, so AZERTY, Dvorak, and similar layouts still trigger the right
  buttons &mdash; but the letters drawn on the on-screen buttons are always the
  QWERTY ones, so they won't match your keycaps if your layout differs.
- **Only the treble (right-hand) side is playable from the computer keyboard**,
  and only its lower four rows. The bass (left-hand) side responds to MIDI input
  and mouse clicks only.
- **Live MIDI input needs the Web MIDI API.** It works reliably in
  Chromium-based browsers (Chrome, Edge, Opera). Recent Firefox and Safari have
  added support but may show an extra permission prompt. If live MIDI doesn't
  work in your browser, MIDI-file upload and the computer keyboard still do.
- **The 144-tone (Einheits) button numbers are not authoritative.** I couldn't
  find a definitive published numbering, so buttons are numbered left-to-right,
  top-to-bottom, bass-to-treble. Treat them as position labels, not standard
  names. The 142-tone (Rheinische) layout is well documented and unaffected.
- **All sound is synthesized** with the Web Audio API, not sampled. The reed
  instruments approximate the character of the real thing rather than reproduce
  it.
- **Very dense MIDI files** with many simultaneous notes may not highlight every
  button perfectly.

### Future plans

The underlying approach here &mdash; map buttons to notes, highlight them from
MIDI input &mdash; isn't specific to the bandoneon. I'd like to extend it to
other squeeze-box instruments, most of which (like the Anglo and Chemnitzer
concertinas) are likewise bisonoric, playing a different note on the push than
on the pull; a few, like the English concertina, are unisonoric instead. More
layouts may be added as time allows.

### Running it locally

It's a static site &mdash; plain HTML, CSS, and JavaScript with no build step.
Clone the repository and either open `index.html` directly or serve the folder
with any static file server, for example:

```
python -m http.server
```

then visit `http://localhost:8000/`. MIDI files are parsed with
[@tonejs/midi](https://github.com/Tonejs/Midi), loaded from a CDN.

---

## 日本語

_（英語版が確定してから追加します。）_

## 中文（繁體）

_（英文版本確認後補上。）_

---

Made by [kei-c.com](https://kei-c.com).
