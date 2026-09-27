const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function transposeChord(chord, semitones) {
  if (!chord || semitones === 0) return chord;

  // Parse root note and modifiers
  let root = chord[0];
  let modifier = chord.slice(1);

  // Handle sharps/flats in root
  if ((chord[1] === '#' || chord[1] === 'b') && chord[2]) {
    root = chord.slice(0, 2);
    modifier = chord.slice(2);
  }

  // Convert flat to sharp
  root = root.replace('b', '#');

  // Find index and transpose
  let idx = chromatic.indexOf(root);
  if (idx === -1) return chord;

  idx = (idx + semitones + 120) % 12;
  return chromatic[idx] + modifier;
}
