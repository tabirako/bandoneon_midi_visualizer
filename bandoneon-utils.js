// Utility functions for bandoneon mapping normalization and lookups
// Exposes window.bandoneonUtils with:
// - normalizeMapping(rawMapping, layout)
// - findMatchingButtons(mapping, midiNote)

(function(){
  function genDefaultMapping(count){
    const start = 21;
    const arr = [];
    let n = start;
    for(let i=0;i<count;i++){
      const side = (i < Math.floor(count/2)) ? 'left' : 'right';
      arr.push({
        id: i + 1,
        side,
        label: String(i + 1),
        push: { note: n, x: 0, y: 0, color: null },
        pull: { note: n + 1, x: 0, y: 0, color: null }
      });
      n += 2;
    }
    return arr;
  }

  function normalizeNoteDef(value, fallback, x, y){
    if(value && typeof value === 'object'){
      return {
        note: Number(value.note ?? fallback ?? 0),
        x: typeof value.x === 'number' ? value.x : x,
        y: typeof value.y === 'number' ? value.y : y,
        color: value.color
      };
    }
    return {
      note: Number(value ?? fallback ?? 0),
      x,
      y,
      color: undefined
    };
  }

  function normalizeMapping(raw, layout){
    if(!Array.isArray(raw) || raw.length === 0){
      return genDefaultMapping(layout === '144' ? 144 : 142);
    }
    return raw.map((it, idx) => {
      const x = typeof it.x === 'number' ? it.x : undefined;
      const y = typeof it.y === 'number' ? it.y : undefined;
      return {
        id: it.id ?? (idx + 1),
        side: (it.side === 'left') ? 'left' : 'right',
        label: it.label ?? String(it.id ?? (idx + 1)),
        push: normalizeNoteDef(it.push, it.push ?? it.pull, x, y),
        pull: normalizeNoteDef(it.pull, it.pull ?? it.push, x, y)
      };
    });
  }

  function normalizeButtonNoteValue(def){
    if(def && typeof def === 'object'){
      return Number(def.note);
    }
    return Number(def);
  }

  function findMatchingButtons(mapping, midiNote, isPull){
    if(!Array.isArray(mapping)) return [];
    return mapping.filter((button) => {
      if (isPull === true) {
        return normalizeButtonNoteValue(button.pull) === Number(midiNote);
      }
      if (isPull === false) {
        return normalizeButtonNoteValue(button.push) === Number(midiNote);
      }
      return normalizeButtonNoteValue(button.push) === Number(midiNote)
        || normalizeButtonNoteValue(button.pull) === Number(midiNote);
    });
  }

  window.bandoneonUtils = { normalizeMapping, findMatchingButtons };
})();
