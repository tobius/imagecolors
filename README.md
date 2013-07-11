
# colormatch

A node module that extracts colors from an image using the color quantization algorithms built into ImageMagick.

## Usage

__install npm module__

    [~/myproject] npm install git://github.com/tobius/colormatch.git

__write test code__

    [~/myproject] vi test.js

    // colormatch
    var colormatch = require('colormatch');

    // usage: colormatch.extract(image_path [, color_count], callback);
    // usage: colormatch.extractPalette(image_path, color_palette [, color_count], callback);

    // extract 10 most prominent colors
    colormatch.extract('node_modules/colormatch/test/photo.jpg', 10, function(err, colors){
        if (!err){
            console.log(colors);
        }
    });

    // extract 10 closest prominent colors based on a custom color palette
    colormatch.extractPalette('node_modules/colormatch/test/photo.jpg', 'node_modules/colormatch/test/palette.json', 10, function(err, colors){
        if (!err){
            console.log(colors);
        }
    });

__watch in action__

    [~/myproject] node test.js
    
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

