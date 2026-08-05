// Optional range-based default button colors.
// Each entry is [thresholdNote, color], sorted ascending by threshold.
// Example:
//   note < 24  => color1
//   24 <= note < 36 => color2
//   36 <= note < 48 => color3
// If the note is higher than the last threshold, the last color is returned.
window.buttonColorRanges = [
  [12, 'hsl(10 75% 65%)'], 
  [24, 'hsl(30 75% 65%)'],
  [36, 'hsl(80 75% 65%)'],
  [48, 'hsl(120 75% 65%)'],
  [60, 'hsl(160 75% 65%)'],
  [72, 'hsl(220 75% 65%)'],
  [84, 'hsl(260 75% 65%)']
];
