
# imagecolors

A node module that pulls useful color information out of an image.

## Install

You can install via NPM.

```shell
[~] mkdir node_modules
[~] npm install imagecolors
```

## Usage

Usage is fairly straight forward.

```javascript
// load module
var imagecolors = require('imagecolors');

/**
 * extract predominant colors from image
 * note: maximum allowed is 48 (cpu intensive)
 * usage: extract(imagePath, numColors)
 */
imagecolors.extract('photo.jpg', 24, function(err, colors){
    if (!err){
        console.log(colors);
    }
});

/**
 * convert colors to a custom palete
 * usage: convert(color_object, palette_json)
 */
imagecolors.convert(colors, './palette.json', function(err, colors){
    if (!err){
        console.log(colors);
    }
});
```

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

<!--
## Miscellaneous Examples

A few examples of miscellaneous ways that you might use this data.

```javascript
// group colors by color family
var families = {};
colors.forEach(function(color){
    if (families[color.family] === undefined){
        families[color.family] = [];
    }
    families[color.family].push(color);
});
```
-->

