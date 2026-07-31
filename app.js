// Simple Bandoneon MIDI Visualizer (client-side)
// - Web MIDI input
// - MIDI file upload (parsed with @tonejs/midi)
// - Select 142 / 144 button layout
// - Per-octave coloring
// - Push/Pull toggle (click or Spacebar)

const container = document.getElementById('bandoneonContainer');
const layoutSelect = document.getElementById('layoutSelect');
const toggleBtn = document.getElementById('togglePushPull');
const mappingFileInput = document.getElementById('mappingFile');
const midiFileInput = document.getElementById('midiFile');
const playMidiBtn = document.getElementById('playMidi');
const stopMidiBtn = document.getElementById('stopMidi');
const midiStatus = document.getElementById('midiStatus');
const incomingNote = document.getElementById('incomingNote');
const incomingVel = document.getElementById('incomingVel');
const activeButtonsSpan = document.getElementById('activeButtons');

let isPull = true; // pull or push (bisonoric state)
let mapping = null; // array of button objects {id, push, pull}
let midiAccess = null;
let scheduledTimers = [];

function genDefaultMapping(count){
  // Generate a default simple mapping for practice.
  // Assign consecutive MIDI numbers for push and pull alternately so each button has two notes.
  const start = 21; // A0
  const arr = [];
  let n = start;
  for(let i=0;i<count;i++){
    arr.push({id: i+1, push: n, pull: n+1});
    n += 2;
  }
  return arr;
}

function loadMappingForLayout(layout){
  const count = layout === '142' ? 142 : 144;
  mapping = genDefaultMapping(count);
  renderMapping();
}

function colorForMidi(note){
  const octave = Math.floor(note/12);
  // Map octave to hue 0..360
  const hue = (octave * 48) % 360; // spread colors
  return `hsl(${hue} 70% 45%)`;
}

function renderMapping(){
  container.innerHTML = '';
  if(!mapping) return;
  // Render as a grid of buttons. Use 12 columns responsive.
  mapping.forEach(btn => {
    const div = document.createElement('div');
    div.className = 'button-cell';
    div.dataset.id = btn.id;
    div.dataset.push = btn.push;
    div.dataset.pull = btn.pull;
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = `Btn ${btn.id}`;
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note';
    const activeNote = isPull ? btn.pull : btn.push;
    noteDiv.textContent = midiToLabel(activeNote);
    noteDiv.style.background = colorForMidi(activeNote);
    noteDiv.style.padding = '6px';
    noteDiv.style.borderRadius = '6px';
    div.appendChild(label);
    div.appendChild(noteDiv);

    div.addEventListener('click', () => {
      // simulate press
      handleNoteOn(isPull ? btn.pull : btn.push, 127);
      setTimeout(()=>handleNoteOff(isPull ? btn.pull : btn.push), 200);
    });

    container.appendChild(div);
  });
}

function midiToLabel(note){
  if(note == null) return '—';
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const octave = Math.floor(note/12) - 1; // MIDI octave offset
  const name = names[note % 12];
  return `${name}${octave}`;
}

function highlightButtonsForNote(note, on=true, vel=127){
  if(!mapping) return;
  const matches = mapping.filter(b => b.push === note || b.pull === note);
  activeButtonsSpan.textContent = matches.map(m=>m.id).join(', ') || '—';
  matches.forEach(m => {
    const el = container.querySelector(`.button-cell[data-id="${m.id}"]`);
    if(el){
      if(on){
        el.classList.add('active');
        const activeNote = (m.push === note) ? m.push : m.pull;
        const noteEl = el.querySelector('.note');
        noteEl.style.boxShadow = `0 0 12px rgba(255,255,255,${Math.min(1,vel/160)})`;
      } else {
        el.classList.remove('active');
        const noteEl = el.querySelector('.note');
        noteEl.style.boxShadow = '';
      }
    }
  });
}

// Web MIDI handling
async function initMIDI(){
  if(!navigator.requestMIDIAccess){
    midiStatus.textContent = 'Web MIDI not supported in this browser.';
    return;
  }
  try{
    midiAccess = await navigator.requestMIDIAccess();
    midiStatus.textContent = 'MIDI ready. Connect a device and play.';
    midiAccess.inputs.forEach(input => input.onmidimessage = onMIDIMessage);
    midiAccess.onstatechange = (e) => {
      // update inputs
      midiAccess.inputs.forEach(input => input.onmidimessage = onMIDIMessage);
    }
  }catch(err){
    midiStatus.textContent = 'MIDI access denied or error.';
    console.error(err);
  }
}

function onMIDIMessage(ev){
  const [status, data1, data2] = ev.data;
  const cmd = status & 0xf0;
  const channel = status & 0x0f;
  if(cmd === 0x90 && data2>0){
    // note on
    handleNoteOn(data1, data2);
  } else if((cmd === 0x80) || (cmd === 0x90 && data2===0)){
    // note off
    handleNoteOff(data1);
  }
}

function handleNoteOn(note, vel){
  incomingNote.textContent = note + ' (' + midiToLabel(note) + ')';
  incomingVel.textContent = vel;
  highlightButtonsForNote(note, true, vel);
}

function handleNoteOff(note){
  // clear highlight for matching buttons
  highlightButtonsForNote(note, false);
}

// Push/Pull toggle
function setPullState(pull){
  isPull = !!pull;
  toggleBtn.textContent = `Mode: ${isPull ? 'Pull' : 'Push'}`;
  // update labels
  container.querySelectorAll('.button-cell').forEach(el => {
    const note = isPull ? Number(el.dataset.pull) : Number(el.dataset.push);
    const noteEl = el.querySelector('.note');
    noteEl.textContent = midiToLabel(note);
    noteEl.style.background = colorForMidi(note);
  });
}

toggleBtn.addEventListener('click', ()=>setPullState(!isPull));
window.addEventListener('keydown', (e)=>{
  if(e.code === 'Space'){
    e.preventDefault();
    setPullState(!isPull);
  }
});

// Mapping JSON upload
mappingFileInput.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const j = JSON.parse(reader.result);
      // expect array of {id,push,pull}
      if(Array.isArray(j)){
        mapping = j;
        renderMapping();
        midiStatus.textContent = 'Mapping loaded.';
      } else {
        alert('Mapping JSON must be an array of {id,push,pull}');
      }
    }catch(err){
      alert('Invalid JSON');
    }
  }
  reader.readAsText(f);
});

// MIDI file upload & playback (uses @tonejs/midi loaded in index.html)
let midiPlayback = null;
let midiStartTime = 0;

midiFileInput.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try{
      const arrayBuffer = reader.result;
      const midi = new Midi(arrayBuffer);
      midiPlayback = midi;
      midiStatus.textContent = 'MIDI file loaded. Click Play.';
    }catch(err){
      console.error(err);
      alert('Failed to parse MIDI file.');
    }
  }
  reader.readAsArrayBuffer(f);
});

function stopScheduled(){
  scheduledTimers.forEach(t=>clearTimeout(t));
  scheduledTimers = [];
}

playMidiBtn.addEventListener('click', ()=>{
  if(!midiPlayback){ alert('Load a MIDI file first.'); return; }
  stopScheduled();
  const now = Date.now();
  midiStartTime = now;
  // schedule note on/off events according to midi.ticksToSeconds via track notes
  midiPlayback.tracks.forEach(track => {
    track.notes.forEach(note => {
      const onTime = Math.max(0, (note.time) * 1000);
      const offTime = Math.max(0, (note.time + note.duration) * 1000);
      const t1 = setTimeout(()=>{
        handleNoteOn(note.midi, Math.round(note.velocity*127));
      }, onTime);
      const t2 = setTimeout(()=>{
        handleNoteOff(note.midi);
      }, offTime);
      scheduledTimers.push(t1,t2);
    });
  });
  midiStatus.textContent = 'Playing MIDI...';
});

stopMidiBtn.addEventListener('click', ()=>{
  stopScheduled();
  midiStatus.textContent = 'Stopped.';
});

// Initialization
loadMappingForLayout(layoutSelect.value);
layoutSelect.addEventListener('change', ()=>loadMappingForLayout(layoutSelect.value));
initMIDI();

// Expose some helpers for debugging
window._bandoneon = {
  setPullState, loadMappingForLayout, mapping
};
