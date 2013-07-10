
# colormatch

A node module that extracts colors from an image using the color quantization algorithms built into ImageMagick.

## Usage

**install**

````
[~/myproject] npm install git://github.com/tobius/colormatch.git
````

**code** 

````javascript
// colormatch
var colormatch = require('colormatch');

// usage: colormatch.extract(image_path [, color_count], callback);

// extract 24 colors (default if none provided)
colormatch.extract('flower.jpg', function(err, colors){
    if (!err){
        console.log(colors);
    }
});

// extract 1-24 colors (showing 15)
colormatch.extract('flower.jpg', 15, function(err, colors){
    if (!err){
        console.log(colors);
    }
});
````

**run**

````
[~/myproject] node test.js

[ { hex: '12AAD9',
    rgb: [ 18, 170, 217 ],
    pixels: 110092,
    percent: 5.31 },
  { hex: '2A57B9',
    rgb: [ 42, 87, 185 ],
    pixels: 14051,
    percent: 0.68 },
  { hex: '313A4B',
    rgb: [ 49, 58, 75 ],
    pixels: 52160,
    percent: 2.52 },
  { hex: '334958',
    rgb: [ 51, 73, 88 ],
    pixels: 77011,
    percent: 3.71 },
  { hex: '36B9B9',
    rgb: [ 54, 185, 185 ],
    pixels: 53135,
    percent: 2.56 },
  { hex: '4F5669',
    rgb: [ 79, 86, 105 ],
    pixels: 190681,
    percent: 9.2 },
  { hex: '565A65',
    rgb: [ 86, 90, 101 ],
    pixels: 118777,
    percent: 5.73 },
  { hex: '58202C',
    rgb: [ 88, 32, 44 ],
    pixels: 55870,
    percent: 2.69 },
  { hex: '62D6E4',
    rgb: [ 98, 214, 228 ],
    pixels: 73196,
    percent: 3.53 },
  { hex: '6A7170',
    rgb: [ 106, 113, 112 ],
    pixels: 133551,
    percent: 6.44 },
  { hex: '6A8C6D',
    rgb: [ 106, 140, 109 ],
    pixels: 49979,
    percent: 2.41 },
  { hex: '6C7489',
    rgb: [ 108, 116, 137 ],
    pixels: 108238,
    percent: 5.22 },
  { hex: '9EE2E7',
    rgb: [ 158, 226, 231 ],
    pixels: 70314,
    percent: 3.39 },
  { hex: '9F095E',
    rgb: [ 159, 9, 94 ],
    pixels: 77335,
    percent: 3.73 },
  { hex: 'B03830',
    rgb: [ 176, 56, 48 ],
    pixels: 59647,
    percent: 2.88 },
  { hex: 'BEA4B6',
    rgb: [ 190, 164, 182 ],
    pixels: 56195,
    percent: 2.71 },
  { hex: 'CFAC5B',
    rgb: [ 207, 172, 91 ],
    pixels: 60964,
    percent: 2.94 },
  { hex: 'DA56B9',
    rgb: [ 218, 86, 185 ],
    pixels: 98324,
    percent: 4.74 },
  { hex: 'E31BA0',
    rgb: [ 227, 27, 160 ],
    pixels: 81326,
    percent: 3.92 },
  { hex: 'E5680B',
    rgb: [ 229, 104, 11 ],
    pixels: 136439,
    percent: 6.58 },
  { hex: 'EB9915',
    rgb: [ 235, 153, 21 ],
    pixels: 73984,
    percent: 3.57 },
  { hex: 'EDDD10',
    rgb: [ 237, 221, 16 ],
    pixels: 66285,
    percent: 3.2 },
  { hex: 'F1F0DC',
    rgb: [ 241, 240, 220 ],
    pixels: 158224,
    percent: 7.63 },
  { hex: 'F4E4A7',
    rgb: [ 244, 228, 167 ],
    pixels: 97822,
    percent: 4.72 } ]
````

