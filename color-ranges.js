// Optional range-based default button colors.
// Each entry is [thresholdNote, color], sorted ascending by threshold.
// Example:
//   note < 24  => color1
//   24 <= note < 36 => color2
//   36 <= note < 48 => color3
// If the note is higher than the last threshold, the last color is returned.
window.buttonColorRanges = [
  [24, 'hsl(220 75% 65%)'],
  [36, 'hsl(160 75% 65%)'],
  [48, 'hsl(100 75% 65%)'],
  [60, 'hsl(40 75% 65%)'],
  [72, 'hsl(10 75% 65%)'],
];
