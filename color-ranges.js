// Optional range-based default button colors.
// Each entry is [thresholdNote, color], sorted ascending by threshold.
// Example:
//   note < 24  => color1
//   24 <= note < 36 => color2
//   36 <= note < 48 => color3
// If the note is higher than the last threshold, the last color is returned.
window.buttonColorRanges = [
  [12, 'hsl(0 75% 65%)'],   // C0
  [24, 'hsl(30 75% 65%)'],  // C1
  [36, 'hsl(60 75% 65%)'], // C2
  [48, 'hsl(100 70% 75%)'], // C3
  [60, 'hsl(180 75% 65%)'], // C4 (Middle C) is 60, 
  [72, 'hsl(220 75% 65%)'], // C5
  [84, 'hsl(260 75% 65%)'], // C6
  [96, 'hsl(320 75% 65%)'], // C7
  [108, 'hsl(0, 0% 65%)']  // C8 
];
