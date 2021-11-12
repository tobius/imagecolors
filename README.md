# Image Colors

Use a combination of color quantization algorithms and human fiddling to get human perceivable colors out of an image.

## Install

This module depends on [ImageMagick](https://imagemagick.org/) and requires [Node.js](https://nodejs.org/) 12+ _(tested on 12, 14, and 16)_.

```sh
[~] brew install imagemagick
[~] npm i imagecolors
```

## Usage

```javascript
const imageColors = require('imagecolors');
async function example() {
	const extracted = await imageColors.extract('./photo.jpg', 8);
	const converted = await imageColors.convert(colors, './palette.json');
	console.log({ extracted, converted });
}
example();
```

_Note: There are working examples in the `/examples` folder._

## Format

Returned color objects look like this:

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

## License

This software library is licensed under the [MIT License](https://github.com/tobius/imagecolors/blob/master/LICENSE).
