// required modules
var _ = require('underscore'),
    color = require('color'),
    extend = require('util')._extend,
    fs = require('fs'),
    gm = require('gm'),
    im = gm.subClass({imageMagick: true});

// exported module
module.exports = {

    /**
     * convert image path to image object
     *
     * @private
     * @param {String} path
     * @param {Function} callback
     */
    convertPathToImage: function(path, callback){

        if (path.match(/^htt/) || fs.lstatSync(path).isFile()){

            // path is valid
            callback(undefined, im(path));

        } else {

            // unable to quantify image path
            callback('Unable to quantify image path', undefined);

        }

    },

    /**
     * extract all colors from an image file
     *
     * @private
     * @param {Object} image
     * @param {Function} callback
     */
    extractAllColors: function(image, callback){

        // extract histogram
        image.stream('histogram', function(err, stdout, stderr){

            if (err){

                // unable to extract histogram data
                callback('Unable to extract histogram data', undefined);

            } else {

                // capture histogram from a data stream
                var histogram = '';
                stdout.addListener('data', function(chunk){
                    histogram += chunk;
                });

                // extract color data from histogram
                stdout.addListener('close', function(){

                    // color objects
                    var colors = [];

                    // limit histogram to pixel data
                    histogram = histogram.replace(/\s+/g, '').replace(/^.+?comment=\{([^\}]+?)\}.+?$/, '$1');

                    // extract pixel data chunks
                    var chunks = histogram.match(/(\d+):\(([\d,]+)\)#([A-F0-9]{6})/g);

                    // split pixel data chunks into pixel objects
                    chunks.forEach(function(chunk){

                        // break chunk into important parts
                        var parts  = /^(\d+):\(([\d,]+)\)#([A-f0-9]{6})$/.exec(chunk);

                        // hex value
                        var hex = '#' + parts[3];

                        // color object
                        var obj = color(hex);

                        // rgb value
                        var rgb = obj.rgb();

                        // hsv value
                        var hsv = obj.hsv();

                        // hsl value
                        var hsl = obj.hsl();

                        // cmyk value
                        var cmyk = obj.cmyk();

                        // number of pixels
                        var pixels = parseInt(parts[1]);

                        // luminance
                        var luminance = Math.round(parseFloat((rgb.r * 0.2126 + rgb.g * 0.7152 + rgb.b * 0.0722) * (1 / 255)).toFixed(2) * 100);

                        // label hex value
                        var labelHex = (luminance < 45) ? '#BBBBBB' : '#444444';

                        // organize results
                        colors.push({
                            pixels      : pixels,
                            luminance   : luminance,
                            hex         : hex,
                            labelHex    : labelHex,
                            rgb         : rgb,
                            hsv         : hsv,
                            hsl         : hsl,
                            cmyk        : cmyk,
                            score       : {}
                        });

                    });

                    // color extraction complete
                    callback(undefined, colors);

                });

            }

        });

    },

    /**
     * assign color families to colors
     *
     * @private
     * @param {Array} colors
     * @param {Function} callback
     */
    assignColorFamilies: function(colors, callback){

        // color family algorithms using HSL
        var families = [

            // brown family
            { name : 'brown',           h : [346,15],   s : [1,60],     l : [1,35]      },  // red -> brown
            { name : 'brown',           h : [16,45],    s : [1,100],    l : [10,35]     },  // yellow-red -> brown

            // pink family
            { name : 'pink',            h : [286,300],  s : [1,100],    l : [71,100]    },  // magenta -> pink
            { name : 'pink',            h : [301,345],  s : [20,100],   l : [50,89]     },  // red-magenta -> pink
            { name : 'pink',            h : [346,9],    s : [1,74],     l : [10,100]    },  // red -> pink

            // red family
            { name : 'red',             h : [10,21],    s : [75,80],    l : [10,100]    },  // red
            { name : 'red',             h : [346,15],   s : [1,100],    l : [10,97]    },

            // orange family
            { name : 'orange',          h : [16,45],    s : [30,100],   l : [15,74]    },  // yellow-red -> orange

            // green family
            { name : 'green',           h : [46,69],    s : [10,70],    l : [10,40]     },  // yellow -> green
            { name : 'green',           h : [70,105],   s : [1,100],    l : [10,100]    },  // green-yellow -> green
            { name : 'green',           h : [106,135],  s : [1,100],    l : [10,100]    },
            { name : 'green',           h : [136,165],  s : [1,100],    l : [10,100]    },  // cyan-green -> green

            // yellow family
            { name : 'yellow',          h : [39,66],    s : [35,100],   l : [15,90]     },

            // purple family
            { name : 'purple',          h : [316,345],  s : [1,90],     l : [10,55]     },  // red-magenta -> purple
            { name : 'purple',          h : [226,255],  s : [1,54],     l : [10,84]     },  // blue -> purple
            { name : 'purple',          h : [256,285],  s : [1,100],    l : [10,100]    },  // magenta-blue -> purple
            { name : 'purple',          h : [286,315],  s : [1,100],    l : [10,70]     },  // magenta -> purple

            // blue family
            { name : 'blue',            h : [166,195],  s : [1,100],    l : [10,88]     },  // cyan -> blue
            { name : 'blue',            h : [196,225],  s : [1,100],    l : [10,100]    },  // blue-cyan -> blue
            { name : 'blue',            h : [226,255],  s : [1,100],    l : [10,84]     },  // blue
            
            // neutral family
            { name : 'light',           h : [0,360],    s : [0,100],    l : [85,100]    },  // light
            { name : 'neutral',         h : [0,360],    s : [0,100],     l : [16,100]    },  // neutral
            { name : 'neutral',         h : [46,65],    s : [11,45],    l : [55,100]    },  // yellow -> neutral
            { name : 'dark',            h : [0,360],    s : [0,13],     l : [0,15]      },  // dark
            { name : 'dark',            h : [0,360],    s : [0,100],    l : [0,9]       }   // dark

        ];

        // find color family
        colors.forEach(function(color){

            // default color family
            var family = null;

            // test color family algorithms
            families.forEach(function(f){

                // only do the work if no match was found
                if (family === null){

                    // trifecta scoring system
                    var trifecta = 0;

                    // run algorithm
                    ['h', 's', 'l'].forEach(function(key){

                        if (f[key][0] > f[key][1]){

                            // this test allows degree boundaries from 0- to 0+
                            if (color.hsl[key] >= f[key][0] || color.hsl[key] <= f[key][1]){

                                // range match
                                trifecta++;

                            }

                        } else if (color.hsl[key] >= f[key][0] && color.hsl[key] <= f[key][1]){

                            // range match
                            trifecta++;

                        }

                    });

                    if (trifecta === 3){

                        // color family match found
                        family = f.name;

                    } else {

                        // color family match failed, reset
                        trifecta = 0;
                    }

                }

            });

            // good or bad, keep what we found
            color.family = family;

        });

        // color family assignment complete
        callback(colors);

    },

    /**
     * merge similar colors together
     *
     * @private
     * @param {Array} colors
     * @return {Array}
     */
    mergeSimilarColors: function(colors){

        // set similarity tolerance thresholds
        var toleranceMax = 0.01;
        var toleranceThreshold = 0;

        // count total number of pixels
        var pixels = 0;
        colors.forEach(function(color){
            pixels += color.pixels;
        });

        // combine similar colors together
        while(true){

            // increase tolerance threshold
            toleranceThreshold += 0.001;

            // track the absorbed colors
            var absorbedColors = [];

            // baseline color matrix
            colors.forEach(function(color1){

                // comparison color matrix
                colors.forEach(function(color2){

                    // process colors that haven't been through this pass
                    if (!_.contains(absorbedColors, color1.hex) && !_.contains(absorbedColors, color2.hex)){

                        // calculate tolerance
                        var tolerance = toleranceThreshold * (255 * 255 * 3) << 0;

                        // calculate distance
                        var distance = 0;
                        distance += Math.pow(color1.rgb.r - color2.rgb.r, 2);
                        distance += Math.pow(color1.rgb.g - color2.rgb.g, 2);
                        distance += Math.pow(color1.rgb.b - color2.rgb.b, 2);

                        if (distance <= tolerance){

                            // colors are similar, absorb them
                            if (color1.percent > color2.percent){

                                // absorb
                                color1.pixels += color2.pixels;
                                color1.percent = Math.round( ( ( color1.pixels / pixels ) * 100) * 100) / 100;
                                absorbedColors.push(color2.hex);

                            }

                        }

                    }

                });

            });

            // color absorption has run its course
            if (colors.length === (colors.length - absorbedColors.length) && toleranceThreshold >= toleranceMax){
                break;
            }

            // keep the dominant colors
            var dominantColors = [];

            // forget the colors that were absorbed
            colors.forEach(function(color){
                if (!_.contains(absorbedColors, color.hex)){
                    dominantColors.push(color);
                }
            });

            // reset color base
            colors = dominantColors;
        }

        // done
        return colors;

    },

    /**
     * sort colors by score value
     *
     * @private
     * @param {Array} colors
     * @param {String} key
     * @param {String} key2 (optional)
     * @return
     */
    sortColorsByScore: function(colors, key){

        var key2 = (arguments.length > 2) ? arguments[2] : null;

        // sort by passed score key
        colors.sort(function(a, b){

            if (a.score && a.score[key] !== undefined){

                // sort descending
                if (a.score[key] === 0 && b.score[key] === 0 && a.score[key2]){

                    // secondary key
                    return (a.score[key2] > b.score[key2]) ? -1 : (b.score[key2] > a.score[key2]) ? 1 : 0;

                } else {

                    // primary key
                    return (a.score[key] > b.score[key]) ? -1 : (b.score[key] > a.score[key]) ? 1 : 0;

                }

            } else {

                // unknown, shove to the bottom
                return 1;
            }

        });

        // done
        return;

    },

    /**
     * apply box algorithm to color collection
     *
     * options = {
     *     name     : 'colorScoreKey',
     *     weight   : 1.0, // 1.0 == full
     *     xRange   : [xMin, xMax],
     *     yRange   : [yMin, yMax],
     *     xTarget  : xTarget, // perfect center
     *     yTarget  : yTarget, // perfect center
     *     getX     : function(o){ return o.targetProperty; },
     *     getY     : function(o){ return o.targetProperty; }
     * }
     *
     * @private
     * @param {Array} colors
     * @param {Object} options
     * @return
     */
    applyBoxedAlgorithm: function(colors, options){

        if (options.name && options.getX && options.getY && options.xRange && options.yRange){

            colors.forEach(function(color){

                var score           = 0;
                var xValue          = options.getX(color);
                var yValue          = options.getY(color);

                if (xValue > options.xRange[0] && xValue < options.xRange[1] && yValue > options.yRange[0] && yValue < options.yRange[1]){

                    var x = (xValue === options.xTarget) ? 100 : 0;

                    if (x !== 100){

                        var xScaleLeft      = options.xTarget - options.xRange[0];
                        var xScaleRight     = options.xRange[1] - options.xTarget;

                        if (xValue < options.xTarget){

                            x = ((xValue - options.xRange[0]) / xScaleLeft) * 100;

                        } else {

                            x = ((options.xRange[1] - xValue) / xScaleRight) * 100;

                        }

                    }

                    var y = (yValue === options.yTarget) ? 100 : 0;

                    if (y !== 100){

                        var yScaleTop       = options.yTarget - options.yRange[0];
                        var yScaleBottom    = options.yRange[1] - options.yTarget;

                        if (yValue < options.yTarget){

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

        return;

    },

    /**
     * apply center color score to color collection
     *
     * @private
     * @param {Array} colors
     * @return
     */
    applyCenterColorScore: function(colors){

        this.applyBoxedAlgorithm(colors, {
            name    : 'center',
            weight  : 0.7,
            xRange  : [20, 80],
            yRange  : [20, 80],
            xTarget : 50,
            yTarget : 50,
            getX    : function(o){ return o.hsl.l; },
            getY    : function(o){ return o.hsl.s; }
        });
        return;
    },

    /**
     * apply vivid color score to color collection
     *
     * @private
     * @param {Array} colors
     * @return
     */
    applyVividColorScore: function(colors){

        this.applyBoxedAlgorithm(colors, {
            name    : 'vivid',
            weight  : 1.0,
            xRange  : [20, 80],
            yRange  : [40, 100],
            xTarget : 50,
            yTarget : 98,
            getX    : function(o){ return o.hsl.l; },
            getY    : function(o){ return o.hsl.s; }
        });
        return;

    },

    /**
     * apply light color score to color collection
     *
     * @private
     * @param {Array} colors
     * @return
     */
    applyLightColorScore: function(colors){

        this.applyBoxedAlgorithm(colors, {
            name    : 'light',
            weight  : 0.4,
            xRange  : [60, 100],
            yRange  : [0, 100],
            xTarget : 80,
            yTarget : 50,
            getX    : function(o){ return o.hsl.l; },
            getY    : function(o){ return o.hsl.s; }
        });
        return;

    },

    /**
     * apply dark color score to color collection
     *
     * @private
     * @param {Array} colors
     * @return
     */
    applyDarkColorScore: function(colors){

        this.applyBoxedAlgorithm(colors, {
            name    : 'dark',
            weight  : 0.4,
            xRange  : [0, 40],
            yRange  : [0, 100],
            xTarget : 20,
            yTarget : 50,
            getX    : function(o){ return o.hsl.l; },
            getY    : function(o){ return o.hsl.s; }
        });
        return;

    },

    /**
     * apply density color score to color collection
     *
     * @private
     * @param {Array} colors
     * @return
     */
    applyDensityColorScore: function(colors){

        var pixels = 0;
        var weight = 0.5;
        var minimum = 0.30;
        colors.forEach(function(color){
            if (color.percent > minimum){
                color.score.density = Math.round(color.percent * weight);
            } else {
                color.score.density = 0;
            }
        });
        return;

    },

    /**
     * apply family color score to color collection
     *
     * @private
     * @param {Array} colors
     * @return
     */
    applyFamilyColorScore: function(colors){

        // ensure averages exist
        this.applyAverageColorScore(colors);

        // sort by averages
        this.sortColorsByScore(colors, 'average');

        // get color families and reset family score
        var families = [];
        colors.forEach(function(color){
            families.push(color.family);
            color.score.familyAverage = 0;
        });

        // up first, down remaining
        var minimumDensity = 0.30;
        families.forEach(function(family){
            var multiplier = 1.5;
            colors.forEach(function(color){
                if (family === color.family){
                    if (color.score.density > minimumDensity){
                        color.score.familyAverage = Math.min(100, Math.round(color.score.average * multiplier));
                        multiplier = multiplier + (multiplier * -0.5);
                    }
                }
            });
        });
        
        // sort by family average
        this.sortColorsByScore(colors, 'familyAverage', 'average');

        // done
        return;

    },

    /**
     * apply average color score to color collection
     *
     * @private
     * @param {Array} colors
     * @return
     */
    applyAverageColorScore: function(colors){

        colors.forEach(function(color){
            var total = 0;
            var scores = _.values(color.score);
            scores.forEach(function(score){
                total += score;
            });
            color.score.average = Math.round(total / scores.length);
        });
        return;

    },

    /**
     * extract the most prominent colors from an image file
     * note: will return up to 24 prominent colors
     *
     * @private
     * @param {String} path
     * @param {Function} callback
     */
    extractProminentColors: function(path, callback){

        // delegate
        var delegate = this;

        // convert path to image
        this.convertPathToImage(path, function(err, image){

            if (err){
                
                // image failed
                callback(err, undefined);

            } else {

                // set a max color count
                var maxPaletteColors = 48;

                // reduce image colors
                image = image.noProfile().bitdepth(8).colors(maxPaletteColors);

                // extract color data
                delegate.extractAllColors(image, function(err, colors){

                    if (err){

                        // unable to extract colors
                        callback(err, undefined);

                    } else {

                        // tally up the pixels
                        var pixels = 0;
                        colors.forEach(function(color){
                            pixels += color.pixels;
                        });

                        // calculate pixel percentage
                        colors.forEach(function(color){
                            color.percent = Math.round( ( ( color.pixels / pixels ) * 100) * 100) / 100;
                        });

                        // assign color families to colors
                        delegate.assignColorFamilies(colors, function(colors){

                            // merge similar colors together
                            colors = delegate.mergeSimilarColors(colors);

                            // create color family collection
                            var families = [];
                            colors.forEach(function(color){

                                // find pre-built family
                                var family = _.findWhere(families, { name : color.family });

                                if (!family){

                                    families.push({
                                        name    : color.family,
                                        pixels  : 0,
                                        percent : 0
                                    });

                                }

                            });

                            // apply center score
                            delegate.applyCenterColorScore(colors);

                            // apply vivid score
                            delegate.applyVividColorScore(colors);

                            // apply light score
                            delegate.applyLightColorScore(colors);

                            // apply dark score
                            delegate.applyDarkColorScore(colors);

                            // apply density score
                            delegate.applyDensityColorScore(colors);

                            // apply family score
                            // note: auto applies and reorders with average scores
                            delegate.applyFamilyColorScore(colors);

                            // prominent color extraction complete
                            callback(undefined, colors);

                        });

                    }

                });

            }

        });

    },

    /**
     * extract predominant colors from an image file
     *
     * Usage:
     *
     * imagecolors.extract('./photo.jpg', function(err, colors){
     *     if (!err){
     *         console.log(colors);
     *     }
     * });
     *
     * imagecolors.extract('http://mysite.com/photo.jpg', function(err, colors){
     *     if (!err){
     *         console.log(colors);
     *     }
     * });
     *
     * @param [String] imagePath
     * @param [Integer] maxColors
     * @param [Function] callback
     */
    extract: function(imagePath, maxColors, callback){

        this.extractProminentColors(imagePath, function(err, colors){

            if (err){

                callback(err, colors);

            } else {

                colors.length = Math.min(colors.length, maxColors);
                callback(undefined, colors);

            }

        });

    },

    /**
     * convert colors to a custom palette
     *
     * Usage:
     *
     * imagecolors.convert(oldColors, './palette.json', function(err, colors){
     *     if (!err){
     *         console.log(colors);
     *     }
     * });
     *
     * @param [Array] oldColors
     * @param [String] palettePath
     * @param [Function] callback
     */
    convert: function(oldColors, palettePath, callback){

        // get palette status
        var paletteStats = fs.lstatSync(palettePath);

        // confirm that file exists
        if (paletteStats.isFile()){

            // get json
            var palette = JSON.parse(fs.readFileSync(palettePath, 'utf8'));

            // matched custom colors
            var customdata = [];

            // process each extracted color
            oldColors.forEach(function(color){

                // record distance calculations
                var minimum = 9999;
                var closest;

                // calculate distance plots to determine the closest possible palette match
                palette.forEach(function(paletteColor){

                    // calculate color deltas
                    var deltaR = color.rgb.r - paletteColor.rgb.r;
                    var deltaG = color.rgb.g - paletteColor.rgb.g;
                    var deltaB = color.rgb.b - paletteColor.rgb.b;

                    // calculate distance between extracted color and palette color
                    var distance = Math.sqrt((deltaR * deltaR) + (deltaG * deltaG) + (deltaB * deltaB));

                    // remember closest color distance proximity
                    if (distance < minimum){
                        minimum = distance;
                        closest = paletteColor;

                        // calculate a custom color scale value (useful for custom sorting)
                        closest.scale = Math.round((Math.sqrt(closest.rgb.r + closest.rgb.g + closest.rgb.b))*100)/100;
                    }

                });

                // combine color attributes to allow custom palettes to be partial
                for (var key in color){
                    if (closest[key] === undefined){
                        closest[key] = color[key];
                    }
                }

                // add closest color
                customdata.push(closest);
            });

            // done
            callback(undefined, customdata);

        } else {

            // bow out
            callback('Palette does not exist', undefined);

        }

    }

};

