// Default 142 and 144 bandoneon mapping definitions.
// Each mapping entry is explicit: left/right side, button label, push/pull note numbers, placement, and note-based color.
/*
window.defaultMappings = {
'142': [  <-- this contains the layout type   
  {
      id: 89,        <-- real id that the program used to call it
      side: 'right', <-- right/left // bass/treble
      label: 'T18',  <-- random markings that are used in a real bandoneon
      push: {        <-- push 
        note: 60,    <-- midi note number, 24 is C1 
        x: 0.19,     <-- x and y can be written as the same level as id/side/label
        y: 0.28,    
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 62,
        x: 0.19,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      }
    }, 
};
*/
window.defaultMappings = {
'142': [
  {
      id: 1,
      side: 'left',
      label: 'B1',
      push: {
        note: 33,
        x: 0.08,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      },
      pull: {
        note: 34,
        x: 0.08,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      }
    },
    {
      id: 2,
      side: 'left',
      label: 'B2',
      push: {
        note: 34,
        x: 0.19,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      },
      pull: {
        note: 36,
        x: 0.19,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 3,
      side: 'left',
      label: 'B3',
      push: {
        note: 35,
        x: 0.3,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      },
      pull: {
        note: 38,
        x: 0.3,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 4,
      side: 'left',
      label: 'B4',
      push: {
        note: 35,
        x: 0.41,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      },
      pull: {
        note: 36,
        x: 0.41,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 5,
      side: 'left',
      label: 'B5',
      push: {
        note: 37,
        x: 0.52,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 39,
        x: 0.52,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 6,
      side: 'left',
      label: 'B6',
      push: {
        note: 37,
        x: 0.63,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 40,
        x: 0.63,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 7,
      side: 'left',
      label: 'B7',
      push: {
        note: 39,
        x: 0.74,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 40,
        x: 0.74,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 8,
      side: 'left',
      label: 'B8',
      push: {
        note: 38,
        x: 0.85,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 40,
        x: 0.85,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 9,
      side: 'left',
      label: 'B9',
      push: {
        note: 39,
        x: 0.08,
        y: 0.18,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 42,
        x: 0.08,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 10,
      side: 'left',
      label: 'B10',
      push: {
        note: 40,
        x: 0.19,
        y: 0.18,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 42,
        x: 0.19,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 11,
      side: 'left',
      label: 'B11',
      push: {
        note: 41,
        x: 0.3,
        y: 0.18,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 44,
        x: 0.3,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 12,
      side: 'left',
      label: 'B12',
      push: {
        note: 41,
        x: 0.41,
        y: 0.18,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 43,
        x: 0.41,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 13,
      side: 'left',
      label: 'B13',
      push: {
        note: 42,
        x: 0.52,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 44,
        x: 0.52,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 14,
      side: 'left',
      label: 'B14',
      push: {
        note: 42,
        x: 0.63,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 45,
        x: 0.63,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 15,
      side: 'left',
      label: 'B15',
      push: {
        note: 44,
        x: 0.74,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 47,
        x: 0.74,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 16,
      side: 'left',
      label: 'B16',
      push: {
        note: 44,
        x: 0.85,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 46,
        x: 0.85,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 17,
      side: 'left',
      label: 'B17',
      push: {
        note: 45,
        x: 0.08,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 48,
        x: 0.08,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 18,
      side: 'left',
      label: 'B18',
      push: {
        note: 46,
        x: 0.19,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 48,
        x: 0.19,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 19,
      side: 'left',
      label: 'B19',
      push: {
        note: 47,
        x: 0.3,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 50,
        x: 0.3,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 20,
      side: 'left',
      label: 'B20',
      push: {
        note: 47,
        x: 0.41,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 49,
        x: 0.41,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 21,
      side: 'left',
      label: 'B21',
      push: {
        note: 49,
        x: 0.52,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 51,
        x: 0.52,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 22,
      side: 'left',
      label: 'B22',
      push: {
        note: 49,
        x: 0.63,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 52,
        x: 0.63,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 23,
      side: 'left',
      label: 'B23',
      push: {
        note: 50,
        x: 0.74,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 52,
        x: 0.74,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 24,
      side: 'left',
      label: 'B24',
      push: {
        note: 50,
        x: 0.85,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 51,
        x: 0.85,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 25,
      side: 'left',
      label: 'B25',
      push: {
        note: 51,
        x: 0.08,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 54,
        x: 0.08,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 26,
      side: 'left',
      label: 'B26',
      push: {
        note: 52,
        x: 0.19,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 54,
        x: 0.19,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 27,
      side: 'left',
      label: 'B27',
      push: {
        note: 53,
        x: 0.3,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 56,
        x: 0.3,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 28,
      side: 'left',
      label: 'B28',
      push: {
        note: 53,
        x: 0.41,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 55,
        x: 0.41,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 29,
      side: 'left',
      label: 'B29',
      push: {
        note: 55,
        x: 0.52,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 57,
        x: 0.52,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 30,
      side: 'left',
      label: 'B30',
      push: {
        note: 55,
        x: 0.63,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 58,
        x: 0.63,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 31,
      side: 'left',
      label: 'B31',
      push: {
        note: 56,
        x: 0.74,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 58,
        x: 0.74,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 32,
      side: 'left',
      label: 'B32',
      push: {
        note: 56,
        x: 0.85,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 57,
        x: 0.85,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 33,
      side: 'left',
      label: 'B33',
      push: {
        note: 57,
        x: 0.08,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 60,
        x: 0.08,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 34,
      side: 'left',
      label: 'B34',
      push: {
        note: 58,
        x: 0.19,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 60,
        x: 0.19,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 35,
      side: 'left',
      label: 'B35',
      push: {
        note: 59,
        x: 0.3,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 62,
        x: 0.3,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 36,
      side: 'left',
      label: 'B36',
      push: {
        note: 59,
        x: 0.41,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 61,
        x: 0.41,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 37,
      side: 'left',
      label: 'B37',
      push: {
        note: 61,
        x: 0.52,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 63,
        x: 0.52,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 38,
      side: 'left',
      label: 'B38',
      push: {
        note: 61,
        x: 0.63,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 62,
        x: 0.63,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 39,
      side: 'left',
      label: 'B39',
      push: {
        note: 62,
        x: 0.74,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 64,
        x: 0.74,
        y: 0.48,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 40,
      side: 'left',
      label: 'B40',
      push: {
        note: 62,
        x: 0.85,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 63,
        x: 0.85,
        y: 0.48,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 41,
      side: 'left',
      label: 'B41',
      push: {
        note: 63,
        x: 0.08,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 66,
        x: 0.08,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 42,
      side: 'left',
      label: 'B42',
      push: {
        note: 64,
        x: 0.19,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 66,
        x: 0.19,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 43,
      side: 'left',
      label: 'B43',
      push: {
        note: 65,
        x: 0.3,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 68,
        x: 0.3,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 44,
      side: 'left',
      label: 'B44',
      push: {
        note: 65,
        x: 0.41,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 67,
        x: 0.41,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 45,
      side: 'left',
      label: 'B45',
      push: {
        note: 67,
        x: 0.52,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 69,
        x: 0.52,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 46,
      side: 'left',
      label: 'B46',
      push: {
        note: 67,
        x: 0.63,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 70,
        x: 0.63,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 47,
      side: 'left',
      label: 'B47',
      push: {
        note: 69,
        x: 0.74,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 71,
        x: 0.74,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 48,
      side: 'left',
      label: 'B48',
      push: {
        note: 69,
        x: 0.85,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 70,
        x: 0.85,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 49,
      side: 'left',
      label: 'B49',
      push: {
        note: 70,
        x: 0.08,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 73,
        x: 0.08,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 50,
      side: 'left',
      label: 'B50',
      push: {
        note: 71,
        x: 0.19,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 73,
        x: 0.19,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 51,
      side: 'left',
      label: 'B51',
      push: {
        note: 72,
        x: 0.3,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 75,
        x: 0.3,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 52,
      side: 'left',
      label: 'B52',
      push: {
        note: 72,
        x: 0.41,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 74,
        x: 0.41,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 53,
      side: 'left',
      label: 'B53',
      push: {
        note: 74,
        x: 0.52,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 76,
        x: 0.52,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 54,
      side: 'left',
      label: 'B54',
      push: {
        note: 74,
        x: 0.63,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 75,
        x: 0.63,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 55,
      side: 'left',
      label: 'B55',
      push: {
        note: 75,
        x: 0.74,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 77,
        x: 0.74,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 56,
      side: 'left',
      label: 'B56',
      push: {
        note: 75,
        x: 0.85,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 76,
        x: 0.85,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 57,
      side: 'left',
      label: 'B57',
      push: {
        note: 76,
        x: 0.08,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 79,
        x: 0.08,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 58,
      side: 'left',
      label: 'B58',
      push: {
        note: 77,
        x: 0.19,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 79,
        x: 0.19,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 59,
      side: 'left',
      label: 'B59',
      push: {
        note: 78,
        x: 0.3,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 80,
        x: 0.3,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 60,
      side: 'left',
      label: 'B60',
      push: {
        note: 78,
        x: 0.41,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 79,
        x: 0.41,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 61,
      side: 'left',
      label: 'B61',
      push: {
        note: 80,
        x: 0.52,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 82,
        x: 0.52,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 62,
      side: 'left',
      label: 'B62',
      push: {
        note: 80,
        x: 0.63,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 81,
        x: 0.63,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 63,
      side: 'left',
      label: 'B63',
      push: {
        note: 81,
        x: 0.74,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 83,
        x: 0.74,
        y: 0.78,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 64,
      side: 'left',
      label: 'B64',
      push: {
        note: 81,
        x: 0.85,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 82,
        x: 0.85,
        y: 0.78,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 65,
      side: 'left',
      label: 'B65',
      push: {
        note: 82,
        x: 0.08,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 85,
        x: 0.08,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 66,
      side: 'left',
      label: 'B66',
      push: {
        note: 83,
        x: 0.19,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 85,
        x: 0.19,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 67,
      side: 'left',
      label: 'B67',
      push: {
        note: 84,
        x: 0.3,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 87,
        x: 0.3,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 68,
      side: 'left',
      label: 'B68',
      push: {
        note: 84,
        x: 0.41,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 86,
        x: 0.41,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 69,
      side: 'left',
      label: 'B69',
      push: {
        note: 86,
        x: 0.52,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 88,
        x: 0.52,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 70,
      side: 'left',
      label: 'B70',
      push: {
        note: 86,
        x: 0.63,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 87,
        x: 0.63,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 71,
      side: 'left',
      label: 'B71',
      push: {
        note: 87,
        x: 0.74,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 89,
        x: 0.74,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 72,
      side: 'right',
      label: 'T1',
      push: {
        note: 47,
        x: 0.08,
        y: 0.08,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 48,
        x: 0.08,
        y: 0.08,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 73,
      side: 'right',
      label: 'T2',
      push: {
        note: 48,
        x: 0.19,
        y: 0.08,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 50,
        x: 0.19,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 74,
      side: 'right',
      label: 'T3',
      push: {
        note: 49,
        x: 0.3,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 52,
        x: 0.3,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 75,
      side: 'right',
      label: 'T4',
      push: {
        note: 49,
        x: 0.41,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 51,
        x: 0.41,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 76,
      side: 'right',
      label: 'T5',
      push: {
        note: 51,
        x: 0.52,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 53,
        x: 0.52,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 77,
      side: 'right',
      label: 'T6',
      push: {
        note: 51,
        x: 0.63,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 52,
        x: 0.63,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 78,
      side: 'right',
      label: 'T7',
      push: {
        note: 52,
        x: 0.74,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 54,
        x: 0.74,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 79,
      side: 'right',
      label: 'T8',
      push: {
        note: 52,
        x: 0.85,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 53,
        x: 0.85,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 80,
      side: 'right',
      label: 'T9',
      push: {
        note: 53,
        x: 0.08,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 56,
        x: 0.08,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 81,
      side: 'right',
      label: 'T10',
      push: {
        note: 54,
        x: 0.19,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 56,
        x: 0.19,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 82,
      side: 'right',
      label: 'T11',
      push: {
        note: 55,
        x: 0.3,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 58,
        x: 0.3,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 83,
      side: 'right',
      label: 'T12',
      push: {
        note: 55,
        x: 0.41,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 57,
        x: 0.41,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 84,
      side: 'right',
      label: 'T13',
      push: {
        note: 57,
        x: 0.52,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 59,
        x: 0.52,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 85,
      side: 'right',
      label: 'T14',
      push: {
        note: 57,
        x: 0.63,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 58,
        x: 0.63,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 86,
      side: 'right',
      label: 'T15',
      push: {
        note: 58,
        x: 0.74,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 60,
        x: 0.74,
        y: 0.18,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 87,
      side: 'right',
      label: 'T16',
      push: {
        note: 58,
        x: 0.85,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 59,
        x: 0.85,
        y: 0.18,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 88,
      side: 'right',
      label: 'T17',
      push: {
        note: 59,
        x: 0.08,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 62,
        x: 0.08,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 89,
      side: 'right',
      label: 'T18',
      push: {
        note: 60,
        x: 0.19,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 62,
        x: 0.19,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 90,
      side: 'right',
      label: 'T19',
      push: {
        note: 61,
        x: 0.3,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 64,
        x: 0.3,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 91,
      side: 'right',
      label: 'T20',
      push: {
        note: 61,
        x: 0.41,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 63,
        x: 0.41,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 92,
      side: 'right',
      label: 'T21',
      push: {
        note: 63,
        x: 0.52,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 65,
        x: 0.52,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 93,
      side: 'right',
      label: 'T22',
      push: {
        note: 63,
        x: 0.63,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 64,
        x: 0.63,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 94,
      side: 'right',
      label: 'T23',
      push: {
        note: 64,
        x: 0.74,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 66,
        x: 0.74,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 95,
      side: 'right',
      label: 'T24',
      push: {
        note: 64,
        x: 0.85,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 65,
        x: 0.85,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 96,
      side: 'right',
      label: 'T25',
      push: {
        note: 65,
        x: 0.08,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 68,
        x: 0.08,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 97,
      side: 'right',
      label: 'T26',
      push: {
        note: 66,
        x: 0.19,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 68,
        x: 0.19,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 98,
      side: 'right',
      label: 'T27',
      push: {
        note: 67,
        x: 0.3,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 70,
        x: 0.3,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 99,
      side: 'right',
      label: 'T28',
      push: {
        note: 67,
        x: 0.41,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 69,
        x: 0.41,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 100,
      side: 'right',
      label: 'T29',
      push: {
        note: 69,
        x: 0.52,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 71,
        x: 0.52,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 101,
      side: 'right',
      label: 'T30',
      push: {
        note: 69,
        x: 0.63,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 70,
        x: 0.63,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 102,
      side: 'right',
      label: 'T31',
      push: {
        note: 70,
        x: 0.74,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 72,
        x: 0.74,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 103,
      side: 'right',
      label: 'T32',
      push: {
        note: 70,
        x: 0.85,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 71,
        x: 0.85,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 104,
      side: 'right',
      label: 'T33',
      push: {
        note: 71,
        x: 0.08,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 74,
        x: 0.08,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 105,
      side: 'right',
      label: 'T34',
      push: {
        note: 72,
        x: 0.19,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 74,
        x: 0.19,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 106,
      side: 'right',
      label: 'T35',
      push: {
        note: 73,
        x: 0.3,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 76,
        x: 0.3,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 107,
      side: 'right',
      label: 'T36',
      push: {
        note: 73,
        x: 0.41,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 75,
        x: 0.41,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 108,
      side: 'right',
      label: 'T37',
      push: {
        note: 75,
        x: 0.52,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 77,
        x: 0.52,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 109,
      side: 'right',
      label: 'T38',
      push: {
        note: 75,
        x: 0.63,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 76,
        x: 0.63,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 110,
      side: 'right',
      label: 'T39',
      push: {
        note: 76,
        x: 0.74,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 78,
        x: 0.74,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 111,
      side: 'right',
      label: 'T40',
      push: {
        note: 76,
        x: 0.85,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 77,
        x: 0.85,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 112,
      side: 'right',
      label: 'T41',
      push: {
        note: 77,
        x: 0.08,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 80,
        x: 0.08,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 113,
      side: 'right',
      label: 'T42',
      push: {
        note: 78,
        x: 0.19,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 80,
        x: 0.19,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 114,
      side: 'right',
      label: 'T43',
      push: {
        note: 79,
        x: 0.3,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 82,
        x: 0.3,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 115,
      side: 'right',
      label: 'T44',
      push: {
        note: 79,
        x: 0.41,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 81,
        x: 0.41,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 116,
      side: 'right',
      label: 'T45',
      push: {
        note: 81,
        x: 0.52,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 83,
        x: 0.52,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 117,
      side: 'right',
      label: 'T46',
      push: {
        note: 81,
        x: 0.63,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 82,
        x: 0.63,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 118,
      side: 'right',
      label: 'T47',
      push: {
        note: 82,
        x: 0.74,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 84,
        x: 0.74,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 119,
      side: 'right',
      label: 'T48',
      push: {
        note: 82,
        x: 0.85,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 83,
        x: 0.85,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 120,
      side: 'right',
      label: 'T49',
      push: {
        note: 83,
        x: 0.08,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 86,
        x: 0.08,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 121,
      side: 'right',
      label: 'T50',
      push: {
        note: 84,
        x: 0.19,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 86,
        x: 0.19,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 122,
      side: 'right',
      label: 'T51',
      push: {
        note: 85,
        x: 0.3,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 88,
        x: 0.3,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 123,
      side: 'right',
      label: 'T52',
      push: {
        note: 85,
        x: 0.41,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 87,
        x: 0.41,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 124,
      side: 'right',
      label: 'T53',
      push: {
        note: 87,
        x: 0.52,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 89,
        x: 0.52,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 125,
      side: 'right',
      label: 'T54',
      push: {
        note: 87,
        x: 0.63,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 88,
        x: 0.63,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 126,
      side: 'right',
      label: 'T55',
      push: {
        note: 88,
        x: 0.74,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 90,
        x: 0.74,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 127,
      side: 'right',
      label: 'T56',
      push: {
        note: 88,
        x: 0.85,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 89,
        x: 0.85,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 128,
      side: 'right',
      label: 'T57',
      push: {
        note: 89,
        x: 0.08,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 92,
        x: 0.08,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 129,
      side: 'right',
      label: 'T58',
      push: {
        note: 90,
        x: 0.19,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 92,
        x: 0.19,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 130,
      side: 'right',
      label: 'T59',
      push: {
        note: 91,
        x: 0.3,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 93,
        x: 0.3,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 131,
      side: 'right',
      label: 'T60',
      push: {
        note: 91,
        x: 0.41,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 92,
        x: 0.41,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 132,
      side: 'right',
      label: 'T61',
      push: {
        note: 92,
        x: 0.52,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 94,
        x: 0.52,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 133,
      side: 'right',
      label: 'T62',
      push: {
        note: 92,
        x: 0.63,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 93,
        x: 0.63,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 134,
      side: 'right',
      label: 'T63',
      push: {
        note: 93,
        x: 0.74,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 95,
        x: 0.74,
        y: 0.78,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 135,
      side: 'right',
      label: 'T64',
      push: {
        note: 93,
        x: 0.85,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 94,
        x: 0.85,
        y: 0.78,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 136,
      side: 'right',
      label: 'T65',
      push: {
        note: 94,
        x: 0.08,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 97,
        x: 0.08,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 137,
      side: 'right',
      label: 'T66',
      push: {
        note: 95,
        x: 0.19,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 97,
        x: 0.19,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 138,
      side: 'right',
      label: 'T67',
      push: {
        note: 96,
        x: 0.3,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 98,
        x: 0.3,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 139,
      side: 'right',
      label: 'T68',
      push: {
        note: 96,
        x: 0.41,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 97,
        x: 0.41,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 140,
      side: 'right',
      label: 'T69',
      push: {
        note: 97,
        x: 0.52,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 99,
        x: 0.52,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 141,
      side: 'right',
      label: 'T70',
      push: {
        note: 97,
        x: 0.63,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 98,
        x: 0.63,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 142,
      side: 'right',
      label: 'T71',
      push: {
        note: 98,
        x: 0.74,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 100,
        x: 0.74,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    }
  ],
  '144': [
    {
      id: 1,
      side: 'left',
      label: 'B1',
      push: {
        note: 33,
        x: 0.08,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      },
      pull: {
        note: 34,
        x: 0.08,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      }
    },
    {
      id: 2,
      side: 'left',
      label: 'B2',
      push: {
        note: 34,
        x: 0.19,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      },
      pull: {
        note: 36,
        x: 0.19,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 3,
      side: 'left',
      label: 'B3',
      push: {
        note: 35,
        x: 0.3,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      },
      pull: {
        note: 38,
        x: 0.3,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 4,
      side: 'left',
      label: 'B4',
      push: {
        note: 35,
        x: 0.41,
        y: 0.08,
        color: 'hsl(104 70% 75%)'
      },
      pull: {
        note: 36,
        x: 0.41,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 5,
      side: 'left',
      label: 'B5',
      push: {
        note: 37,
        x: 0.52,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 39,
        x: 0.52,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 6,
      side: 'left',
      label: 'B6',
      push: {
        note: 37,
        x: 0.63,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 40,
        x: 0.63,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 7,
      side: 'left',
      label: 'B7',
      push: {
        note: 39,
        x: 0.74,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 40,
        x: 0.74,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 8,
      side: 'left',
      label: 'B8',
      push: {
        note: 38,
        x: 0.85,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 40,
        x: 0.85,
        y: 0.08,
        color: 'hsl(146 70% 75%)'
      }
    },
    {
      id: 9,
      side: 'left',
      label: 'B9',
      push: {
        note: 39,
        x: 0.08,
        y: 0.18,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 42,
        x: 0.08,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 10,
      side: 'left',
      label: 'B10',
      push: {
        note: 40,
        x: 0.19,
        y: 0.18,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 42,
        x: 0.19,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 11,
      side: 'left',
      label: 'B11',
      push: {
        note: 41,
        x: 0.3,
        y: 0.18,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 44,
        x: 0.3,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 12,
      side: 'left',
      label: 'B12',
      push: {
        note: 41,
        x: 0.41,
        y: 0.18,
        color: 'hsl(146 70% 75%)'
      },
      pull: {
        note: 43,
        x: 0.41,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 13,
      side: 'left',
      label: 'B13',
      push: {
        note: 42,
        x: 0.52,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 44,
        x: 0.52,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 14,
      side: 'left',
      label: 'B14',
      push: {
        note: 42,
        x: 0.63,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 45,
        x: 0.63,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 15,
      side: 'left',
      label: 'B15',
      push: {
        note: 44,
        x: 0.74,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 47,
        x: 0.74,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 16,
      side: 'left',
      label: 'B16',
      push: {
        note: 44,
        x: 0.85,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 46,
        x: 0.85,
        y: 0.18,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 17,
      side: 'left',
      label: 'B17',
      push: {
        note: 45,
        x: 0.08,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 48,
        x: 0.08,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 18,
      side: 'left',
      label: 'B18',
      push: {
        note: 46,
        x: 0.19,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 48,
        x: 0.19,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      }
    },
    {
      id: 19,
      side: 'left',
      label: 'B19',
      push: {
        note: 47,
        x: 0.3,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 50,
        x: 0.3,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 20,
      side: 'left',
      label: 'B20',
      push: {
        note: 47,
        x: 0.41,
        y: 0.28,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 49,
        x: 0.41,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 21,
      side: 'left',
      label: 'B21',
      push: {
        note: 49,
        x: 0.52,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 51,
        x: 0.52,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 22,
      side: 'left',
      label: 'B22',
      push: {
        note: 49,
        x: 0.63,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 52,
        x: 0.63,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 23,
      side: 'left',
      label: 'B23',
      push: {
        note: 50,
        x: 0.74,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 52,
        x: 0.74,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 24,
      side: 'left',
      label: 'B24',
      push: {
        note: 50,
        x: 0.85,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 51,
        x: 0.85,
        y: 0.28,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 25,
      side: 'left',
      label: 'B25',
      push: {
        note: 51,
        x: 0.08,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 54,
        x: 0.08,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 26,
      side: 'left',
      label: 'B26',
      push: {
        note: 52,
        x: 0.19,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 54,
        x: 0.19,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 27,
      side: 'left',
      label: 'B27',
      push: {
        note: 53,
        x: 0.3,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 56,
        x: 0.3,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 28,
      side: 'left',
      label: 'B28',
      push: {
        note: 53,
        x: 0.41,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 55,
        x: 0.41,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 29,
      side: 'left',
      label: 'B29',
      push: {
        note: 55,
        x: 0.52,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 57,
        x: 0.52,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 30,
      side: 'left',
      label: 'B30',
      push: {
        note: 55,
        x: 0.63,
        y: 0.38,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 58,
        x: 0.63,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 31,
      side: 'left',
      label: 'B31',
      push: {
        note: 56,
        x: 0.74,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 58,
        x: 0.74,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 32,
      side: 'left',
      label: 'B32',
      push: {
        note: 56,
        x: 0.85,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 57,
        x: 0.85,
        y: 0.38,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 33,
      side: 'left',
      label: 'B33',
      push: {
        note: 57,
        x: 0.08,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 60,
        x: 0.08,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 34,
      side: 'left',
      label: 'B34',
      push: {
        note: 58,
        x: 0.19,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 60,
        x: 0.19,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 35,
      side: 'left',
      label: 'B35',
      push: {
        note: 59,
        x: 0.3,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 62,
        x: 0.3,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 36,
      side: 'left',
      label: 'B36',
      push: {
        note: 59,
        x: 0.41,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 61,
        x: 0.41,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 37,
      side: 'left',
      label: 'B37',
      push: {
        note: 61,
        x: 0.52,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 63,
        x: 0.52,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 38,
      side: 'left',
      label: 'B38',
      push: {
        note: 61,
        x: 0.63,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 62,
        x: 0.63,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 39,
      side: 'left',
      label: 'B39',
      push: {
        note: 62,
        x: 0.74,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 64,
        x: 0.74,
        y: 0.48,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 40,
      side: 'left',
      label: 'B40',
      push: {
        note: 62,
        x: 0.85,
        y: 0.48,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 63,
        x: 0.85,
        y: 0.48,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 41,
      side: 'left',
      label: 'B41',
      push: {
        note: 63,
        x: 0.08,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 66,
        x: 0.08,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 42,
      side: 'left',
      label: 'B42',
      push: {
        note: 64,
        x: 0.19,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 66,
        x: 0.19,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 43,
      side: 'left',
      label: 'B43',
      push: {
        note: 65,
        x: 0.3,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 68,
        x: 0.3,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 44,
      side: 'left',
      label: 'B44',
      push: {
        note: 65,
        x: 0.41,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 67,
        x: 0.41,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 45,
      side: 'left',
      label: 'B45',
      push: {
        note: 67,
        x: 0.52,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 69,
        x: 0.52,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 46,
      side: 'left',
      label: 'B46',
      push: {
        note: 67,
        x: 0.63,
        y: 0.58,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 70,
        x: 0.63,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 47,
      side: 'left',
      label: 'B47',
      push: {
        note: 69,
        x: 0.74,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 71,
        x: 0.74,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 48,
      side: 'left',
      label: 'B48',
      push: {
        note: 69,
        x: 0.85,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 70,
        x: 0.85,
        y: 0.58,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 49,
      side: 'left',
      label: 'B49',
      push: {
        note: 70,
        x: 0.08,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 73,
        x: 0.08,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 50,
      side: 'left',
      label: 'B50',
      push: {
        note: 71,
        x: 0.19,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 73,
        x: 0.19,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 51,
      side: 'left',
      label: 'B51',
      push: {
        note: 72,
        x: 0.3,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 75,
        x: 0.3,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 52,
      side: 'left',
      label: 'B52',
      push: {
        note: 72,
        x: 0.41,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 74,
        x: 0.41,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 53,
      side: 'left',
      label: 'B53',
      push: {
        note: 74,
        x: 0.52,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 76,
        x: 0.52,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 54,
      side: 'left',
      label: 'B54',
      push: {
        note: 74,
        x: 0.63,
        y: 0.68,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 75,
        x: 0.63,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 55,
      side: 'left',
      label: 'B55',
      push: {
        note: 75,
        x: 0.74,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 77,
        x: 0.74,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 56,
      side: 'left',
      label: 'B56',
      push: {
        note: 75,
        x: 0.85,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 76,
        x: 0.85,
        y: 0.68,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 57,
      side: 'left',
      label: 'B57',
      push: {
        note: 76,
        x: 0.08,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 79,
        x: 0.08,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 58,
      side: 'left',
      label: 'B58',
      push: {
        note: 77,
        x: 0.19,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 79,
        x: 0.19,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 59,
      side: 'left',
      label: 'B59',
      push: {
        note: 78,
        x: 0.3,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 80,
        x: 0.3,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 60,
      side: 'left',
      label: 'B60',
      push: {
        note: 78,
        x: 0.41,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 79,
        x: 0.41,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 61,
      side: 'left',
      label: 'B61',
      push: {
        note: 80,
        x: 0.52,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 82,
        x: 0.52,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 62,
      side: 'left',
      label: 'B62',
      push: {
        note: 80,
        x: 0.63,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 81,
        x: 0.63,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 63,
      side: 'left',
      label: 'B63',
      push: {
        note: 81,
        x: 0.74,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 83,
        x: 0.74,
        y: 0.78,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 64,
      side: 'left',
      label: 'B64',
      push: {
        note: 81,
        x: 0.85,
        y: 0.78,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 82,
        x: 0.85,
        y: 0.78,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 65,
      side: 'left',
      label: 'B65',
      push: {
        note: 82,
        x: 0.08,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 85,
        x: 0.08,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 66,
      side: 'left',
      label: 'B66',
      push: {
        note: 83,
        x: 0.19,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 85,
        x: 0.19,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 67,
      side: 'left',
      label: 'B67',
      push: {
        note: 84,
        x: 0.3,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 87,
        x: 0.3,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 68,
      side: 'left',
      label: 'B68',
      push: {
        note: 84,
        x: 0.41,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 86,
        x: 0.41,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 69,
      side: 'left',
      label: 'B69',
      push: {
        note: 86,
        x: 0.52,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 88,
        x: 0.52,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 70,
      side: 'left',
      label: 'B70',
      push: {
        note: 86,
        x: 0.63,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 87,
        x: 0.63,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 71,
      side: 'left',
      label: 'B71',
      push: {
        note: 87,
        x: 0.74,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 89,
        x: 0.74,
        y: 0.88,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 72,
      side: 'left',
      label: 'B72',
      push: {
        note: 87,
        x: 0.85,
        y: 0.88,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 88,
        x: 0.85,
        y: 0.88,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 73,
      side: 'right',
      label: 'T1',
      push: {
        note: 48,
        x: 0.08,
        y: 0.08,
        color: 'hsl(188 70% 75%)'
      },
      pull: {
        note: 49,
        x: 0.08,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 74,
      side: 'right',
      label: 'T2',
      push: {
        note: 49,
        x: 0.19,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 51,
        x: 0.19,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 75,
      side: 'right',
      label: 'T3',
      push: {
        note: 50,
        x: 0.3,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 52,
        x: 0.3,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 76,
      side: 'right',
      label: 'T4',
      push: {
        note: 50,
        x: 0.41,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 51,
        x: 0.41,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 77,
      side: 'right',
      label: 'T5',
      push: {
        note: 52,
        x: 0.52,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 54,
        x: 0.52,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 78,
      side: 'right',
      label: 'T6',
      push: {
        note: 52,
        x: 0.63,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 53,
        x: 0.63,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 79,
      side: 'right',
      label: 'T7',
      push: {
        note: 53,
        x: 0.74,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 55,
        x: 0.74,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 80,
      side: 'right',
      label: 'T8',
      push: {
        note: 53,
        x: 0.85,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 54,
        x: 0.85,
        y: 0.08,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 81,
      side: 'right',
      label: 'T9',
      push: {
        note: 54,
        x: 0.08,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 57,
        x: 0.08,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 82,
      side: 'right',
      label: 'T10',
      push: {
        note: 55,
        x: 0.19,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 57,
        x: 0.19,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 83,
      side: 'right',
      label: 'T11',
      push: {
        note: 56,
        x: 0.3,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 58,
        x: 0.3,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 84,
      side: 'right',
      label: 'T12',
      push: {
        note: 56,
        x: 0.41,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 57,
        x: 0.41,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      }
    },
    {
      id: 85,
      side: 'right',
      label: 'T13',
      push: {
        note: 58,
        x: 0.52,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 60,
        x: 0.52,
        y: 0.18,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 86,
      side: 'right',
      label: 'T14',
      push: {
        note: 58,
        x: 0.63,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 59,
        x: 0.63,
        y: 0.18,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 87,
      side: 'right',
      label: 'T15',
      push: {
        note: 59,
        x: 0.74,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 61,
        x: 0.74,
        y: 0.18,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 88,
      side: 'right',
      label: 'T16',
      push: {
        note: 59,
        x: 0.85,
        y: 0.18,
        color: 'hsl(230 70% 75%)'
      },
      pull: {
        note: 60,
        x: 0.85,
        y: 0.18,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 89,
      side: 'right',
      label: 'T17',
      push: {
        note: 60,
        x: 0.08,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 63,
        x: 0.08,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 90,
      side: 'right',
      label: 'T18',
      push: {
        note: 61,
        x: 0.19,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      },
      pull: {
        note: 63,
        x: 0.19,
        y: 0.28,
        color: 'hsl(272 70% 75%)'
      }
    },
    {
      id: 91,
      side: 'right',
      label: 'T19',
      push: {
        note: 63,
        x: 0.3,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 65,
        x: 0.3,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 92,
      side: 'right',
      label: 'T20',
      push: {
        note: 63,
        x: 0.41,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 64,
        x: 0.41,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 93,
      side: 'right',
      label: 'T21',
      push: {
        note: 64,
        x: 0.52,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 66,
        x: 0.52,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 94,
      side: 'right',
      label: 'T22',
      push: {
        note: 64,
        x: 0.63,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 65,
        x: 0.63,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      }
    },
    {
      id: 95,
      side: 'right',
      label: 'T23',
      push: {
        note: 65,
        x: 0.74,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 67,
        x: 0.74,
        y: 0.28,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 96,
      side: 'right',
      label: 'T24',
      push: {
        note: 65,
        x: 0.85,
        y: 0.28,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 66,
        x: 0.85,
        y: 0.28,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 97,
      side: 'right',
      label: 'T25',
      push: {
        note: 66,
        x: 0.08,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 69,
        x: 0.08,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 98,
      side: 'right',
      label: 'T26',
      push: {
        note: 67,
        x: 0.19,
        y: 0.38,
        color: 'hsl(314 70% 75%)'
      },
      pull: {
        note: 69,
        x: 0.19,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 99,
      side: 'right',
      label: 'T27',
      push: {
        note: 69,
        x: 0.3,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 71,
        x: 0.3,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 100,
      side: 'right',
      label: 'T28',
      push: {
        note: 69,
        x: 0.41,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 70,
        x: 0.41,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 101,
      side: 'right',
      label: 'T29',
      push: {
        note: 70,
        x: 0.52,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 72,
        x: 0.52,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 102,
      side: 'right',
      label: 'T30',
      push: {
        note: 70,
        x: 0.63,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 71,
        x: 0.63,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 103,
      side: 'right',
      label: 'T31',
      push: {
        note: 71,
        x: 0.74,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 73,
        x: 0.74,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 104,
      side: 'right',
      label: 'T32',
      push: {
        note: 71,
        x: 0.85,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 72,
        x: 0.85,
        y: 0.38,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 105,
      side: 'right',
      label: 'T33',
      push: {
        note: 72,
        x: 0.08,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 75,
        x: 0.08,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 106,
      side: 'right',
      label: 'T34',
      push: {
        note: 73,
        x: 0.19,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 75,
        x: 0.19,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      }
    },
    {
      id: 107,
      side: 'right',
      label: 'T35',
      push: {
        note: 74,
        x: 0.3,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 76,
        x: 0.3,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 108,
      side: 'right',
      label: 'T36',
      push: {
        note: 74,
        x: 0.41,
        y: 0.48,
        color: 'hsl(356 70% 75%)'
      },
      pull: {
        note: 75,
        x: 0.41,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 109,
      side: 'right',
      label: 'T37',
      push: {
        note: 76,
        x: 0.52,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 78,
        x: 0.52,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 110,
      side: 'right',
      label: 'T38',
      push: {
        note: 76,
        x: 0.63,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 77,
        x: 0.63,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 111,
      side: 'right',
      label: 'T39',
      push: {
        note: 77,
        x: 0.74,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 79,
        x: 0.74,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 112,
      side: 'right',
      label: 'T40',
      push: {
        note: 77,
        x: 0.85,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 78,
        x: 0.85,
        y: 0.48,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 113,
      side: 'right',
      label: 'T41',
      push: {
        note: 78,
        x: 0.08,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 81,
        x: 0.08,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 114,
      side: 'right',
      label: 'T42',
      push: {
        note: 79,
        x: 0.19,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 81,
        x: 0.19,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 115,
      side: 'right',
      label: 'T43',
      push: {
        note: 80,
        x: 0.3,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 82,
        x: 0.3,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 116,
      side: 'right',
      label: 'T44',
      push: {
        note: 80,
        x: 0.41,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 81,
        x: 0.41,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      }
    },
    {
      id: 117,
      side: 'right',
      label: 'T45',
      push: {
        note: 81,
        x: 0.52,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 83,
        x: 0.52,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 118,
      side: 'right',
      label: 'T46',
      push: {
        note: 81,
        x: 0.63,
        y: 0.58,
        color: 'hsl(38 70% 75%)'
      },
      pull: {
        note: 82,
        x: 0.63,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 119,
      side: 'right',
      label: 'T47',
      push: {
        note: 82,
        x: 0.74,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 84,
        x: 0.74,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 120,
      side: 'right',
      label: 'T48',
      push: {
        note: 82,
        x: 0.85,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 83,
        x: 0.85,
        y: 0.58,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 121,
      side: 'right',
      label: 'T49',
      push: {
        note: 83,
        x: 0.08,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 86,
        x: 0.08,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 122,
      side: 'right',
      label: 'T50',
      push: {
        note: 84,
        x: 0.19,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 86,
        x: 0.19,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 123,
      side: 'right',
      label: 'T51',
      push: {
        note: 85,
        x: 0.3,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 88,
        x: 0.3,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 124,
      side: 'right',
      label: 'T52',
      push: {
        note: 85,
        x: 0.41,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 87,
        x: 0.41,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      }
    },
    {
      id: 125,
      side: 'right',
      label: 'T53',
      push: {
        note: 87,
        x: 0.52,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 89,
        x: 0.52,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 126,
      side: 'right',
      label: 'T54',
      push: {
        note: 87,
        x: 0.63,
        y: 0.68,
        color: 'hsl(80 70% 75%)'
      },
      pull: {
        note: 88,
        x: 0.63,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 127,
      side: 'right',
      label: 'T55',
      push: {
        note: 88,
        x: 0.74,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 90,
        x: 0.74,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 128,
      side: 'right',
      label: 'T56',
      push: {
        note: 88,
        x: 0.85,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 89,
        x: 0.85,
        y: 0.68,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 129,
      side: 'right',
      label: 'T57',
      push: {
        note: 89,
        x: 0.08,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 92,
        x: 0.08,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 130,
      side: 'right',
      label: 'T58',
      push: {
        note: 90,
        x: 0.19,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 92,
        x: 0.19,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 131,
      side: 'right',
      label: 'T59',
      push: {
        note: 91,
        x: 0.3,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 93,
        x: 0.3,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 132,
      side: 'right',
      label: 'T60',
      push: {
        note: 91,
        x: 0.41,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 92,
        x: 0.41,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 133,
      side: 'right',
      label: 'T61',
      push: {
        note: 92,
        x: 0.52,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 94,
        x: 0.52,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 134,
      side: 'right',
      label: 'T62',
      push: {
        note: 92,
        x: 0.63,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 93,
        x: 0.63,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      }
    },
    {
      id: 135,
      side: 'right',
      label: 'T63',
      push: {
        note: 93,
        x: 0.74,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 95,
        x: 0.74,
        y: 0.78,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 136,
      side: 'right',
      label: 'T64',
      push: {
        note: 93,
        x: 0.85,
        y: 0.78,
        color: 'hsl(122 70% 75%)'
      },
      pull: {
        note: 94,
        x: 0.85,
        y: 0.78,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 137,
      side: 'right',
      label: 'T65',
      push: {
        note: 94,
        x: 0.08,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 97,
        x: 0.08,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 138,
      side: 'right',
      label: 'T66',
      push: {
        note: 95,
        x: 0.19,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 97,
        x: 0.19,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 139,
      side: 'right',
      label: 'T67',
      push: {
        note: 96,
        x: 0.3,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 98,
        x: 0.3,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 140,
      side: 'right',
      label: 'T68',
      push: {
        note: 96,
        x: 0.41,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 97,
        x: 0.41,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 141,
      side: 'right',
      label: 'T69',
      push: {
        note: 97,
        x: 0.52,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 99,
        x: 0.52,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 142,
      side: 'right',
      label: 'T70',
      push: {
        note: 97,
        x: 0.63,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 98,
        x: 0.63,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 143,
      side: 'right',
      label: 'T71',
      push: {
        note: 98,
        x: 0.74,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 100,
        x: 0.74,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    },
    {
      id: 144,
      side: 'right',
      label: 'T72',
      push: {
        note: 98,
        x: 0.85,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      },
      pull: {
        note: 99,
        x: 0.85,
        y: 0.88,
        color: 'hsl(164 70% 75%)'
      }
    }
  ]
};
