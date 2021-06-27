
# Image Colors

Use a combination of color quantization algorithms and human fiddling to get human perceivable colors out of an image.

## Install

```shell
[~] npm i imagecolors
```

## Usage

Usage of this module is pretty versatile.

```javascript
// load module
var imageColors = require('imagecolors');

/**
 * Extract human perceivable colors from image
 * @param {String} imagePath
 * @param {Integer} [colorCount] (default=24)
 * @param {Function} callback
 */
let humanColors;
imageColors.extract('./photo.jpg', 6, (err, colors) => {
	if (!!err) {
		console.error({ err: err.message });
	} else {
		console.log({ humanColors: colors })
	}
});

/**
 * Convert colors to the closest neighbors in a custom color palette
 * @param {Array} colors
 * @param {String} palettePath
 * @param {Function} callback
 */
let closeColors;
imageColors.convert(colors, './palette.json', (err, colors) => {
	if (!!err) {
		console.error({ err: err.message });
	} else {
		console.log({ closeColors: colors })
	}
});
```

_Note: There are working examples in the `/examples` folder._

## Return Format

Returned color objects look like this.

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
