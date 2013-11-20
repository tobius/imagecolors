
# imagecolors

A node module that pulls useful color information out of an image through a combination of ImageMagick color quantization algorithms and human fiddling.

## Install

You can install via NPM.

```shell
[~] npm install imagecolors
```

## Usage

Using this module is pretty straight forward.

```javascript
// load module
var imagecolors = require('imagecolors');

/**
 * extract predominant colors from image
 * note: maximum is currently capped at 96, need to do load testing before raising
 * usage: extract(imagePath, numColors, callback)
 */
imagecolors.extract('./photo.jpg', 6, function(err, colors){
    if (!err){
        console.log('EXTRACTED');
        console.log(colors);
        console.log();
    }

    /**
     * convert colors to a custom palete
     * usage: convert(color_object, palette_json, callback)
     */
    imagecolors.convert(colors, './palette.json', function(err, colors){
        if (!err){
            console.log('CONVERTED');
            console.log(colors);
        }
    });
});
```

_Note: There are also example assets in the examples folder to help get you started._

## Return Format

This is what returned color objects look like.

```javascript
[{
    pixels      : 208781,
    hex         : '#F0F0DC',
    labelHex    : '#444444',
    rgb         : { r: 240, g: 240, b: 220 },
    hsv         : { h: 60, s: 8, v: 94 },
    hsl         : { h: 60, s: 40, l: 90 },
    luminance   : '0.94',
    cmyk        : { c: 0, m: 0, y: 8, k: 6 },
    percent     : 10.07,
    family      : 'yellow'
}]
```

