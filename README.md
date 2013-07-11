
# colormatch

A node module that extracts colors from an image using the color quantization algorithms built into ImageMagick.

## Install

There already exists a colormatch node module in the NPM registry so I'm just putting this here for now. I might rename it later or see about merging the functionality into the other module that was already published. In the meantime feel free to use this git repo in package.json.

``` bash
[~] mkdir node_modules
[~] npm install git://github.com/tobius/colormatch.git
```

## Load Assets

If you already have a photo and/or JSON color palette to use then by all means. Otherwise you can use the ones out of the unit test folder to get started.

``` bash
[~] curl -O https://raw.github.com/tobius/colormatch/master/test/photo.jpg
[~] curl -O https://raw.github.com/tobius/colormatch/master/test/palette.json
```

## Code

Using this module is pretty easy, here's an example to get you started.

``` bash
[~] vi test.js
```

``` javascript
var colormatch = require('colormatch');

// extract 10 most prominent colors
colormatch.extract('photo.jpg', 10, function(err, colors){
    if (!err){
        console.log('\ntop 10 colors\n------------------------------');
        console.log(colors);
    }
});

// extract 10 closest prominent colors based on a custom color palette
colormatch.extractPalette('photo.jpg', __dirname + '/palette.json', 10, function(err, colors){
    if (!err){
        console.log('\ntop 10 preferred colors\n------------------------------');
        console.log(colors);
    }
});
```

## Run

I doubt that your goal was to pump this out to the command line, but for README usefulness I thought I'd show you what the example up above should produce. This is what you'll have to work with.

``` bash
[~] node test.js

top 10 colors
------------------------------
[ { hex: '33BACD',
    rgb: [ 51, 186, 205 ],
    pixels: 236486,
    percent: 11.4 },
  { hex: '433341',
    rgb: [ 67, 51, 65 ],
    pixels: 177275,
    percent: 8.55 },
  { hex: '575D69',
    rgb: [ 87, 93, 105 ],
    pixels: 465931,
    percent: 22.47 },
  { hex: '606F91',
    rgb: [ 96, 111, 145 ],
    pixels: 114858,
    percent: 5.54 },
  { hex: '6A8C6D',
    rgb: [ 106, 140, 109 ],
    pixels: 67665,
    percent: 3.26 },
  { hex: 'C54528',
    rgb: [ 197, 69, 40 ],
    pixels: 223280,
    percent: 10.77 },
  { hex: 'C8C6BC',
    rgb: [ 200, 198, 188 ],
    pixels: 168145,
    percent: 8.11 },
  { hex: 'DE3DAE',
    rgb: [ 222, 61, 174 ],
    pixels: 192152,
    percent: 9.27 },
  { hex: 'DFB232',
    rgb: [ 223, 178, 50 ],
    pixels: 215312,
    percent: 10.38 },
  { hex: 'F1F0DC',
    rgb: [ 241, 240, 220 ],
    pixels: 212496,
    percent: 10.25 } ]

top 10 preferred colors
------------------------------
[ { hex: '31AAC1',
    rgb: [ 49, 170, 193 ],
    scale: 20.3,
    pixels: 236486,
    percent: 11.4 },
  { hex: '3B373E',
    rgb: [ 59, 55, 62 ],
    scale: 13.27,
    pixels: 177275,
    percent: 8.55 },
  { hex: '545C64',
    rgb: [ 84, 92, 100 ],
    scale: 16.61,
    pixels: 465931,
    percent: 22.47 },
  { hex: '626E82',
    rgb: [ 98, 110, 130 ],
    scale: 18.38,
    pixels: 114858,
    percent: 5.54 },
  { hex: '688D6A',
    rgb: [ 104, 141, 106 ],
    scale: 18.73,
    pixels: 67665,
    percent: 3.26 },
  { hex: 'C44B2F',
    rgb: [ 196, 75, 47 ],
    scale: 17.83,
    pixels: 223280,
    percent: 10.77 },
  { hex: 'CDC7BE',
    rgb: [ 205, 199, 190 ],
    scale: 24.37,
    pixels: 168145,
    percent: 8.11 },
  { hex: 'D56890',
    rgb: [ 213, 104, 144 ],
    scale: 21.47,
    pixels: 192152,
    percent: 9.27 },
  { hex: 'E5B73E',
    rgb: [ 229, 183, 62 ],
    scale: 21.77,
    pixels: 215312,
    percent: 10.38 },
  { hex: 'EFECDD',
    rgb: [ 239, 236, 221 ],
    scale: 26.38,
    pixels: 212496,
    percent: 10.25 } ]
```

