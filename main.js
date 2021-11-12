/* eslint-disable consistent-return,no-constant-condition */

// modules
const Color = require('color');
const diff = require('color-diff');
const fs = require('fs').promises;
const gm = require('gm');

// init
const im = gm.subClass({ imageMagick: true });

/**
 * Apply average color score to color collection
 * @param {Array} colors
 * @return
 */
function applyAverageColorScore(colors) {
  colors.forEach((color) => {
    let total = 0;
    const scores = Object.values(color.score);
    scores.forEach((score) => {
      total += score;
    });
    color.score.average = Math.round(total / scores.length);
  });
}

/**
 * Apply box algorithm to color collection
 * ```
 * options = {
 *     name     : 'colorScoreKey',
 *     weight   : 1.0, // 1.0 == full
 *     xRange   : [xMin, xMax],
 *     yRange   : [yMin, yMax],
 *     xTarget  : xTarget, // perfect center
 *     yTarget  : yTarget, // perfect center
 *     getX     : (o) => o.targetProperty,
 *     getY     : (o) => o.targetProperty,
 * }
 * ```
 * @param {Array} colors
 * @param {Object} options
 */
function applyBoxAlgorithm(colors, options) {
  if (options.name && options.getX && options.getY && options.xRange && options.yRange) {
    colors.forEach((color) => {
      let x;
      let y;
      let xScaleLeft;
      let xScaleRight;
      let yScaleTop;
      let yScaleBottom;

      let score = 0;
      const xValue = options.getX(color);
      const yValue = options.getY(color);

      if (xValue > options.xRange[0]
        && xValue < options.xRange[1]
        && yValue > options.yRange[0]
        && yValue < options.yRange[1]) {

        x = (xValue === options.xTarget) ? 100 : 0;

        if (x !== 100) {
          xScaleLeft = options.xTarget - options.xRange[0];
          xScaleRight = options.xRange[1] - options.xTarget;
          if (xValue < options.xTarget) {
            x = ((xValue - options.xRange[0]) / xScaleLeft) * 100;
          } else {
            x = ((options.xRange[1] - xValue) / xScaleRight) * 100;
          }
        }

        y = (yValue === options.yTarget) ? 100 : 0;
        if (y !== 100) {
          yScaleTop = options.yTarget - options.yRange[0];
          yScaleBottom = options.yRange[1] - options.yTarget;

          if (yValue < options.yTarget) {
            y = ((yValue - options.yRange[0]) / yScaleTop) * 100;
          } else {
            y = ((options.yRange[1] - yValue) / yScaleBottom) * 100;
          }
        }
        score = (x + y) / 2;
      }

      // save
      color.score[options.name] = Math.round(score * options.weight);
    });
  }
}

/**
 * Apply center color score to color collection
 * @param {Array} colors
 */
function applyCenterColorScore(colors) {
  applyBoxAlgorithm(colors, {
    name: 'center',
    weight: 0.7,
    xRange: [20, 80],
    yRange: [20, 80],
    xTarget: 50,
    yTarget: 50,
    getX: (o) => o.hsl.l,
    getY: (o) => o.hsl.s,
  });
}

/**
 * Apply vivid color score to color collection
 * @param {Array} colors
 */
function applyVividColorScore(colors) {
  applyBoxAlgorithm(colors, {
    name: 'vivid',
    weight: 1.0,
    xRange: [20, 80],
    yRange: [40, 100],
    xTarget: 50,
    yTarget: 98,
    getX: (o) => o.hsl.l,
    getY: (o) => o.hsl.s,
  });
}

/**
 * Apply light color score to color collection
 * @param {Array} colors
 */
function applyLightColorScore(colors) {
  applyBoxAlgorithm(colors, {
    name: 'light',
    weight: 0.4,
    xRange: [60, 100],
    yRange: [0, 100],
    xTarget: 80,
    yTarget: 50,
    getX: (o) => o.hsl.l,
    getY: (o) => o.hsl.s,
  });
}

/**
 * Apply dark color score to color collection
 * @param {Array} colors
 */
function applyDarkColorScore(colors) {
  applyBoxAlgorithm(colors, {
    name: 'dark',
    weight: 0.4,
    xRange: [0, 40],
    yRange: [0, 100],
    xTarget: 20,
    yTarget: 50,
    getX: (o) => o.hsl.l,
    getY: (o) => o.hsl.s,
  });
}

/**
 * Apply density color score to color collection
 * @param {Array} colors
 * @return
 */
function applyDensityColorScore(colors) {
  const weight = 0.5;
  const minimum = 0.30;
  colors.forEach((color) => {
    if (color.percent > minimum) {
      color.score.density = Math.round(color.percent * weight);
    } else {
      color.score.density = 0;
    }
  });
}

/**
 * Sort colors by score value
 * @param {Array} colors
 * @param {String} key
 * @param {String} [key2]
 * @return {Integer}
 */
function sortColorsByScore(colors, key, key2 = null) {
  // sort by passed score key
  colors.sort((a, b) => {
    if (a.score && a.score[key]) {
      // sort descending
      if (a.score[key] === 0 && b.score[key] === 0 && a.score[key2]) {
        // secondary key
        if (a.score[key2] > b.score[key2]) {
          return -1;
        }
        return (b.score[key2] > a.score[key2]) ? 1 : 0;
      }
      // primary key
      if (a.score[key] > b.score[key]) {
        return -1;
      }
      return (b.score[key] > a.score[key]) ? 1 : 0;
    }
    // unknown, shove to the bottom
    return 1;
  });
}

/**
 * Apply family color score to color collection
 * @param {Array} colors
 * @return
 */
function applyFamilyColorScore(colors) {
  // ensure averages exist
  applyAverageColorScore(colors);

  // sort by averages
  sortColorsByScore(colors, 'average');

  // get color families and reset family score
  const families = [];
  colors.forEach((color) => {
    families.push(color.family);
    color.score.familyAverage = 0;
  });

  // up first, down remaining
  const minimumDensity = 0.30;
  families.forEach((family) => {
    let multiplier = 1.5;
    colors.forEach((color) => {
      if (family === color.family) {
        if (color.score.density > minimumDensity) {
          color.score.familyAverage = Math.min(100, Math.round(color.score.average * multiplier));
          multiplier += (multiplier * -0.5);
        }
      }
    });
  });

  // sort by family average
  sortColorsByScore(colors, 'familyAverage', 'average');
}

/**
 * Assign color families to colors
 * @param {Array} colors
 * @return {Array} colors
 */
function assignColorFamilies(colors) {
  // color family algorithms using HSL
  const families = [
    // brown family
    { name: 'brown', h: [346, 15], s: [1, 60], l: [1, 35] }, // red -> brown
    { name: 'brown', h: [16, 45], s: [1, 100], l: [10, 35] }, // yellow-red -> brown

    // pink family
    { name: 'pink', h: [286, 300], s: [1, 100], l: [71, 100] }, // magenta -> pink
    { name: 'pink', h: [301, 345], s: [20, 100], l: [50, 89] }, // red-magenta -> pink
    { name: 'pink', h: [346, 9], s: [1, 74], l: [10, 100] }, // red -> pink

    // red family
    { name: 'red', h: [10, 21], s: [75, 80], l: [10, 100] }, // red
    { name: 'red', h: [346, 15], s: [20, 100], l: [10, 97] },

    // orange family
    { name: 'orange', h: [16, 45], s: [30, 100], l: [15, 74] }, // yellow-red -> orange

    // green family
    { name: 'green', h: [46, 69], s: [10, 70], l: [10, 40] }, // yellow -> green
    { name: 'green', h: [70, 105], s: [1, 100], l: [10, 100] }, // green-yellow -> green
    { name: 'green', h: [106, 135], s: [1, 100], l: [10, 100] },
    { name: 'green', h: [136, 165], s: [1, 100], l: [10, 100] }, // cyan-green -> green

    // yellow family
    { name: 'yellow', h: [39, 66], s: [35, 100], l: [15, 90] },

    // purple family
    { name: 'purple', h: [316, 345], s: [1, 90], l: [10, 55] }, // red-magenta -> purple
    { name: 'purple', h: [226, 255], s: [1, 54], l: [10, 84] }, // blue -> purple
    { name: 'purple', h: [256, 285], s: [1, 100], l: [10, 100] }, // magenta-blue -> purple
    { name: 'purple', h: [286, 315], s: [1, 100], l: [10, 70] }, // magenta -> purple

    // blue family
    { name: 'blue', h: [166, 195], s: [1, 100], l: [10, 88] }, // cyan -> blue
    { name: 'blue', h: [196, 225], s: [1, 100], l: [10, 100] }, // blue-cyan -> blue
    { name: 'blue', h: [226, 255], s: [1, 100], l: [10, 84] }, // blue

    // neutral family
    { name: 'light', h: [0, 360], s: [0, 100], l: [85, 100] }, // light
    { name: 'neutral', h: [0, 360], s: [0, 100], l: [16, 100] }, // neutral
    { name: 'neutral', h: [46, 65], s: [11, 45], l: [55, 100] }, // yellow -> neutral
    { name: 'dark', h: [0, 360], s: [0, 13], l: [0, 15] }, // dark
    { name: 'dark', h: [0, 360], s: [0, 100], l: [0, 9] }, // dark
  ];

  // find color family
  colors.forEach((color) => {
    // default color family
    let family = null;

    // test color family algorithms
    families.forEach((f) => {

      // only do the work if no match was found
      if (family === null) {

        // trifecta scoring system
        let trifecta = 0;

        // run algorithm
        ['h', 's', 'l'].forEach((key) => {
          if (f[key][0] > f[key][1]) {
            // this test allows degree boundaries from 0- to 0+
            if (color.hsl[key] >= f[key][0] || color.hsl[key] <= f[key][1]) {
              trifecta += 1;
            }
          } else if (color.hsl[key] >= f[key][0] && color.hsl[key] <= f[key][1]) {
            trifecta += 1;
          }
        });

        // color family match found
        if (trifecta === 3) {
          family = f.name;
        }
      }
    });

    // good or bad, keep what we found
    color.family = family;
  });

  // color family assignment complete
  return colors;
}

/**
 * Build a complete color profile from a hex value
 * @param {String} hex
 * @return {Object}
 */
function buildColorProfile(hex) {
  // color object
  const obj = Color(hex);

  // rgb value
  let rgb = obj.rgb();
  rgb = {
    r: rgb.color[0],
    g: rgb.color[1],
    b: rgb.color[2],
  };

  // hsv value
  let hsv = obj.hsv();
  hsv = {
    h: hsv.color[0],
    s: hsv.color[1],
    v: hsv.color[2],
  };

  // hsl value
  let hsl = obj.hsl();
  hsl = {
    h: hsl.color[0],
    s: hsl.color[1],
    l: hsl.color[2],
  };

  // cmyk value
  let cmyk = obj.cmyk();
  cmyk = {
    c: cmyk.color[0],
    m: cmyk.color[1],
    y: cmyk.color[2],
    k: cmyk.color[3],
  };

  // luminance
  const luminance = Math.round(
    parseFloat((rgb.r * 0.2126 + rgb.g * 0.7152 + rgb.b * 0.0722) * (1 / 255)).toFixed(2) * 100,
  );

  // label hex value
  const labelHex = (luminance < 45) ? '#BBBBBB' : '#444444';

  // done
  return { cmyk, hex, hsl, hsv, labelHex, luminance, rgb };
}

/**
 * Convert image path to image object
 * @param {String} path
 * @return {Promise<Object>} image
 */
async function convertPathToImage(path) {
  if (path.match(/^htt/)) {
    return im(path);
  }
  const stats = await fs.lstat(path);
  if (stats.isFile()) {
    return im(path);
  }
  throw new Error('Unable to quantify image path');
}

/**
 * Convert color to the closest palette color
 * @param {Object} color
 * @param {Array} palette
 * @return {Object}
 */
function convertToClosestColor(color, palette) {
  // extract and build RGB from the palette colors
  // note: this is for the color-diff module which requires UPPERCASE keys)
  const rgb = [];
  palette.forEach((paletteColor) => {
    rgb.push({
      R: paletteColor.rgb.r,
      G: paletteColor.rgb.g,
      B: paletteColor.rgb.b,
    });
  });

  // get closest color
  const closestColor = diff.closest({
    R: color.rgb.r,
    G: color.rgb.g,
    B: color.rgb.b,
  }, rgb);

  // get closest palette color
  let closestPaletteColor;
  palette.forEach((paletteColor) => {
    if (paletteColor.rgb.r === closestColor.R
      && paletteColor.rgb.g === closestColor.G
      && paletteColor.rgb.b === closestColor.B) {
      closestPaletteColor = paletteColor;
    }
  });

  // build a complete closest color profile
  const completeColor = buildColorProfile(closestPaletteColor.hex);

  // create final color object
  const finalColor = {
    ...closestPaletteColor,
    hex: completeColor.hex,
    labelHex: completeColor.labelHex,
    rgb: completeColor.rgb,
    cmyk: completeColor.cmyk,
    hsv: completeColor.hsv,
    hsl: completeColor.hsl,
    luminance: completeColor.luminance,
    family: closestPaletteColor.family ? closestPaletteColor.family : color.family,
    pixels: color.pixels,
    percent: color.percent,
    score: color.score,
    original: color,
  };

  // done
  return finalColor;
}

/**
 * Extract all colors from an image file
 * @param {Object} image
 * @return {Promise<Array>} colors
 */
function extractAllColors(image) {
  return new Promise((resolve, reject) => {
    // extract histogram
    // @todo see if this has a promise interface
    image.stream('histogram', (err, stdout) => {
      if (err) {
        return reject(new Error('Unable to extract histogram data'));
      }

      // capture histogram from a data stream
      let histogram = '';
      stdout.addListener('data', (chunk) => {
        histogram += chunk;
      });

      // extract color data from histogram
      stdout.addListener('close', () => {
        let parts;
        let hex;
        let pixels;

        // color objects
        const colors = [];

        // limit histogram to pixel data
        histogram = histogram.replace(/\s+/g, '').replace(/^.+?comment=\{([^}]+?)\}.+?$/, '$1');

        // extract pixel data chunks
        const chunks = histogram.match(/(\d+):\(([\d,.]+)\)#([A-F0-9]{6})/g);

        if (!chunks) {
          return reject(new Error('Histogram extraction failed'));
        }

        // split pixel data chunks into pixel objects
        chunks.forEach((chunk) => {
          // break chunk into important parts
          parts = /^(\d+):\(([\d,.]+)\)#([A-f0-9]{6})$/.exec(chunk);

          // hex value
          hex = `#${parts[3]}`;

          // build color
          const color = buildColorProfile(hex);

          // number of pixels
          pixels = parseInt(parts[1], 10);

          // organize results
          colors.push({
            pixels,
            luminance: color.luminance,
            hex,
            labelHex: color.labelHex,
            rgb: color.rgb,
            hsv: color.hsv,
            hsl: color.hsl,
            cmyk: color.cmyk,
            score: {},
          });
        });

        // color extraction complete
        return resolve(colors);
      });
    });
  });
}

/**
 * Get euclidian distance between two arrays
 * @param {Array} arr1
 * @param {Array} arr2
 * @return {Integer}
 */
function getEuclidianDistance(arr1, arr2) {
  let d = 0;
  const l = arr1.length;
  for (let i = 0; i < l; i += 1) {
    d += ((arr1[i] - arr2[i]) ** 2); // difference to the power of 2
  }
  d = Math.sqrt(d); // square root of total
  return d;
}

/**
 * Merge similar colors together
 * @param {Array} colors
 * @return {Array}
 */
function mergeSimilarColors(colors) {
  let i;
  let j;
  let absorbedColors;
  let dominantColors;
  let distance;
  let color1;
  let color2;
  let mergedColors = colors;

  // set similarity tolerance thresholds
  const toleranceMax = 50;
  let toleranceThreshold = 0;

  // count total number of pixels
  let pixels = 0;
  mergedColors.forEach((color) => {
    pixels += color.pixels;
  });

  // keep dominant colors
  const keepDominantColor = (color) => {
    if (!absorbedColors.includes(color.hex)) {
      dominantColors.push(color);
    }
  };

  // combine similar colors together
  while (true) {
    // increase tolerance threshold
    toleranceThreshold += 1;

    // track the absorbed colors
    absorbedColors = [];

    // baseline color matrix
    for (i = mergedColors.length - 1; i > -1; i -= 1) {
      color1 = mergedColors[i];

      // comparison color matrix
      for (j = mergedColors.length - 1; j > -1; j -= 1) {
        color2 = mergedColors[j];

        // process colors that haven't been through this pass
        if (!absorbedColors.includes(color1.hex) && !absorbedColors.includes(color2.hex)) {

          // calculate tolerance
          distance = getEuclidianDistance(Object.values(color1.rgb), Object.values(color2.rgb));

          // colors are similar, absorb them
          if (distance <= toleranceThreshold && color1.percent > color2.percent) {
            color1.pixels += color2.pixels;
            color1.percent = Math.round(((color1.pixels / pixels) * 100) * 100) / 100;
            absorbedColors.push(color2.hex);
          }
        }
      }
    }

    // color absorption has run its course
    if (
      mergedColors.length === (mergedColors.length - absorbedColors.length)
      && toleranceThreshold >= toleranceMax
    ) {
      break;
    }

    // keep the dominant colors
    dominantColors = [];
    mergedColors.forEach(keepDominantColor);

    // reset color base
    mergedColors = dominantColors;
  }

  // done
  return mergedColors;
}

/**
 * Extract the most prominent colors from an image file
 * _Note: Will return up to 24 prominent colors._
 * @param {String} path
 * @return {Promise<Array>} colors
 */
async function extractProminentColors(path) {
  // convert path to image
  const image = await convertPathToImage(path);

  // set a max color count
  const maxPaletteColors = 24;

  // reduce image colors
  const reducedImage = image.noProfile()
    .bitdepth(8)
    .colorspace('YCbCr')
    .colors(maxPaletteColors)
    .colorspace('sRGB');

  // extract color data
  const colors = await extractAllColors(reducedImage);

  // tally up the pixels
  let pixels = 0;
  colors.forEach((color) => {
    pixels += color.pixels;
  });

  // calculate pixel percentage
  colors.forEach((color) => {
    color.percent = Math.round(((color.pixels / pixels) * 100) * 100) / 100;
  });

  // assign color families to colors
  const familyColors = assignColorFamilies(colors);

  // merge similar colors together
  const mergedColors = mergeSimilarColors(familyColors);

  // create color family collection
  const families = [];
  mergedColors.forEach((color) => {
    if (!families.find((family) => family.name === color.family)) {
      families.push({
        name: color.family,
        pixels: 0,
        percent: 0,
      });
    }
  });

  // apply scores
  applyCenterColorScore(mergedColors);
  applyVividColorScore(mergedColors);
  applyLightColorScore(mergedColors);
  applyDarkColorScore(mergedColors);
  applyDensityColorScore(mergedColors);
  applyFamilyColorScore(mergedColors);

  // prominent color extraction complete
  return mergedColors;
}

// export
module.exports = {
  /**
   * Convert colors to a custom palette
   * ```
   * Usage:
   * imagecolors.convert(oldColors, './palette.json', (err, colors) => {
   *     if (!err) {
   *         console.log(colors);
   *     }
   * });
   * ```
   * @param {Array} oldColors
   * @param {String} palettePath
   * @param {Function} [callback]
   * @return {Promise<Array>} colors
   */
  convert: async (oldColors, palettePath, callback = undefined) => {
    try {
      const paletteStats = await fs.lstat(palettePath);
      if (!paletteStats.isFile()) {
        throw new Error('Palette does not exist');
      }
      const file = await fs.readFile(palettePath, 'utf8');
      const palette = JSON.parse(file);
      const convertedColors = oldColors.map((oldColor) => convertToClosestColor(oldColor, palette));
      if (callback) {
        callback(null, convertedColors);
      }
      return convertedColors;
    } catch (err) {
      if (callback) {
        callback(err);
      }
      throw err;
    }
  },

  /**
   * Extract predominant colors from an image file
   * ```
   * Usage:
   * imagecolors.extract('./photo.jpg', (err, colors) => {
   *     if (!err) {
   *         console.log(colors);
   *     }
   * });
   * imagecolors.extract('http://mysite.com/photo.jpg', (err, colors) => {
   *     if (!err) {
   *         console.log(colors);
   *     }
   * });
   * ```
   * @param {String} imagePath
   * @param {Integer} [maxColors] (default = 24)
   * @param {Function} [callback]
   * @return {Promise<Array>} colors
   */
  extract: async (imagePath, maxColors = 24, callback = undefined) => {
    try {
      const colors = await extractProminentColors(imagePath);
      colors.length = Math.min(colors.length, maxColors);
      if (callback) {
        callback(null, colors);
      }
      return colors;
    } catch (err) {
      if (callback) {
        callback(err);
      }
      throw err;
    }
  },
};
