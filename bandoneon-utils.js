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
      const side = (i < Math.floor(count/4)) ? 'left' : 'right';
      arr.push({
        id: i + 1,
        side,
        label: String(i + 1),
        open: { note: n, x: 0, y: 0, color: null },
        close: { note: n + 1, x: 0, y: 0, color: null }
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
      if(layout === '144'){return genDefaultMapping(144);}
      if(layout === '142'){return genDefaultMapping(142);} 
    }
    return raw.map((it, idx) => {
      const x = typeof it.x === 'number'
        ? it.x
        : (it.close && typeof it.close.x === 'number' ? it.close.x : (it.open && typeof it.open.x === 'number' ? it.open.x : undefined));
      const y = typeof it.y === 'number'
        ? it.y
        : (it.close && typeof it.close.y === 'number' ? it.close.y : (it.open && typeof it.open.y === 'number' ? it.open.y : undefined));
      return {
        id: it.id ?? (idx + 1), //We need to use a dummy id because there are duplicate notes on bandoneon layout
        side: (it.side === 'left') ? 'left' : 'right',
        label: it.label ?? String(it.id ?? (idx + 1)),
        x,
        y,
        open: normalizeNoteDef(it.open, it.open ?? it.close, x, y),
        close: normalizeNoteDef(it.close, it.close ?? it.open, x, y)
      };
    });
  }

  function normalizeButtonNoteValue(def){
    if(def && typeof def === 'object'){
      return Number(def.note);
    }
    return Number(def);
  }

  function findMatchingButtons(mapping, midiNote, isOpen){
    if(!Array.isArray(mapping)) return [];
    return mapping.filter((button) => {
      if (isOpen === true) {
        return normalizeButtonNoteValue(button.open) === Number(midiNote);
      }
      if (isOpen === false) {
        return normalizeButtonNoteValue(button.close) === Number(midiNote);
      }
      return normalizeButtonNoteValue(button.close) === Number(midiNote)
        || normalizeButtonNoteValue(button.open) === Number(midiNote);
    });
  }

  window.bandoneonUtils = { normalizeMapping, findMatchingButtons };
})();
