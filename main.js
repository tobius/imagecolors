// required modules
var _ = require('underscore'),
    color = require('color'),
    fs = require('fs'),
    gm = require('gm'),
    im = gm.subClass({imageMagick: true});

// exported module
module.exports = {

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
     * @param [Integer] numColors
     * @param [Function] callback
     */
    extract: function(imagePath, numColors, callback){

        // force acceptable number of colors
        numColors = (typeof numColors === 'undefined') ? 24 : Math.min(numColors, 96);

        // prepare for output
        var colors = [];

        // get image status
        var isUri = imagePath.match(/^htt/) ? true : false;
        var isValid = (!isUri && fs.lstatSync(imagePath).isFile()) ? true : (isUri ? true : false);

        // imagePath appears valid
        if (isValid){

            // use imagemagick to simplify image
            var image = im(imagePath).noProfile().bitdepth(8).colors(numColors);

            // extract histogram from image
            image.stream('histogram', function(err, stdout, stderr){
                if (!err){

                    // capture and use histogram
                    var histogram = '';
                    stdout.addListener('data', function(chunk){
                        histogram += chunk;
                    });
                    stdout.addListener('close', function(){
                        
                        // extract color data, ignore the rest
                        histogram = histogram
                            .replace(/\s+/g, '')
                            .replace(/^.+?comment=\{([^\}]+?)\}.+?$/, '$1');

                        // convert histogram string into color data
                        var prominentColors = [];
                        var totalPixels = 0;
                        histogram.match(/(\d+):\(([\d,]+)\)#([A-f0-9]{6})/g).forEach(function(prominentColor){
                            var parts  = /^(\d+):\(([\d,]+)\)#([A-f0-9]{6})$/.exec(prominentColor);
                            var hex = '#' + parts[3];
                            var pixels = parseInt(parts[1]);
                            var obj = color(hex);
                            var rgb = obj.rgb();
                            var luminance = parseFloat((rgb.r * 0.2126 + rgb.g * 0.7152 + rgb.b * 0.0722) * (1 / 255)).toFixed(2);
                            var labelHex = (luminance < 0.45) ? '#BBBBBB' : '#444444';
                            prominentColors.push({
                                pixels      : pixels,
                                hex         : hex,
                                labelHex    : labelHex,
                                rgb         : rgb,
                                hsv         : obj.hsv(),
                                hsl         : obj.hsl(),
                                luminance   : luminance,
                                cmyk        : obj.cmyk()
                            });
                            totalPixels += pixels;
                        });

                        // calculate pixel percentage
                        prominentColors.forEach(function(prominentColor){
                            prominentColor.percent = Math.round(((prominentColor.pixels/totalPixels)*100)*100)/100;
                        });

                        // testing
                        var isSimilar = function(color1, color2){
                            var tolerance = 0.01 * (255 * 255 * 3) << 0;
                            var distance = 0;
                            distance += Math.pow(color1.rgb.r - color2.rgb.r, 2);
                            distance += Math.pow(color1.rgb.g - color2.rgb.g, 2);
                            distance += Math.pow(color1.rgb.b - color2.rgb.b, 2);
                            return distance <= tolerance;
                        };

                        var isDifferent = function(color, colors){
                            var colorLength = colors.length;
                            for (var i = 0; i < colorLength; i++){
                                if (isSimilar(color, colors[i])){
                                    return false;
                                }
                            }
                            return true;
                        };

                        var getUniqueColors = function(colors, max){
                            var unique = [];
                            var colorLength = colors.length;
                            for (var i = 0; i < colorLength && unique.length < max; i++){
                                if (isDifferent(colors[i], unique)){
                                    unique.push(colors[i]);
                                }
                            }
                            return unique;
                        };

                        // calculate color family
                        prominentColors.forEach(function(color){

                            // family matching algorithms
                            var families = [
                                { name : 'neutral',         h : null,       s : null,       l : [90,100]    },  // light
                                { name : 'neutral',         h : null,       s : [0,10],     l : null        },  // medium
                                { name : 'neutral',         h : null,       s : null,       l : [0,10]      },  // dark
                                { name : 'pink',            h : [346,15],   s : [0,60],     l : null        },  // red -> pink
                                { name : 'brown',           h : [346,15],   s : null,       l : [0,40]      },  // red -> brown
                                { name : 'red',             h : [346,15],   s : null,       l : null        },
                                { name : 'orange',          h : [16,45],    s : [0,70],     l : null        },  // yellow-red -> brown
                                { name : 'orange',          h : [16,45],    s : null,       l : null        },  // yellow-red -> orange
                                { name : 'yellow',          h : [46,75],    s : null,       l : [0,80]      },  // yellow -> green
                                { name : 'yellow',          h : [46,75],    s : null,       l : null        },
                                { name : 'green',           h : [76,105],   s : null,       l : null        },  // green-yellow -> green
                                { name : 'green',           h : [106,135],  s : null,       l : null        },
                                { name : 'green',           h : [136,165],  s : null,       l : null        },  // cyan-green -> green
                                { name : 'blue',            h : [166,195],  s : null,       l : null        },  // cyan -> blue
                                { name : 'blue',            h : [196,225],  s : null,       l : null        },  // blue-cyan -> blue
                                { name : 'purple',          h : [226,255],  s : [0,54],     l : null        },  // blue -> purple
                                { name : 'blue',            h : [226,255],  s : null,       l : null        },
                                { name : 'purple',          h : [256,285],  s : null,       l : null        },  // magenta-blue -> purple
                                { name : 'purple',          h : [286,315],  s : null,       l : [0,70]      },  // magenta -> purple
                                { name : 'pink',            h : [286,315],  s : null,       l : [71,100]    },  // magenta -> pink
                                { name : 'pink',            h : [316,345],  s : null,       l : null        }   // red-magenta -> pink
                            ];

                            // find color family
                            var family = 'unknown';
                            families.forEach(function(f){

                                // default to true
                                var match = true;

                                // test conditions
                                ['h','s','l'].forEach(function(key){
                                    if (match && f[key]){
                                        if (f[key][0] > f[key][1]){
                                            if (!(color.hsl[key] >= f[key][0] || color.hsl[key] <= f[key][1])){
                                                match = false;
                                            }
                                        } else if (!(color.hsl[key] >= f[key][0] && color.hsl[key] <= f[key][1])){
                                            match = false;
                                        }
                                    }
                                });

                                // assign result if pass
                                if (match){
                                    family = f.name;
                                }
                            });
                            color.family = family;

                        });

                        // extract the most unique colors
                        //prominentColors = getUniqueColors(prominentColors, numColors);

                        /*
                        // calculate color family
                        var families = [
                            { name: 'black',             family: 'black',  rgb: { r:0,   g:0,   b:0   } },
                            { name: 'blue',              family: 'blue',   rgb: { r:0,   g:0,   b:255 } },
                            { name: 'lightblue',         family: 'blue',   rgb: { r:173, g:216, b:230 } },
                            { name: 'darkblue',          family: 'blue',   rgb: { r:0,   g:0,   b:139 } },
                            { name: 'cadetblue',         family: 'blue',   rgb: { r:95,  g:158, b:160 } },
                            { name: 'cornflowerblue',    family: 'blue',   rgb: { r:100, g:149, b:237 } },
                            { name: 'deepskyblue',       family: 'blue',   rgb: { r:0,   g:191, b:255 } },
                            { name: 'dodgeblue',         family: 'blue',   rgb: { r:30,  g:144, b:255 } },
                            { name: 'turquoise',         family: 'blue',   rgb: { r:64,  g:224, b:208 } },
                            { name: 'powderblue',        family: 'blue',   rgb: { r:176, g:224, b:230 } },
                            { name: 'lightcyan',         family: 'blue',   rgb: { r:224, g:255, b:255 } },
                            { name: 'babyblue',          family: 'blue',   rgb: { r:217, g:239, b:246 } }, // custom
                            { name: 'brown',             family: 'brown',  rgb: { r:165, g:42,  b:42  } },
                            { name: 'saddlebrown',       family: 'brown',  rgb: { r:139, g:69,  b:19  } },
                            { name: 'sienna',            family: 'brown',  rgb: { r:160, g:82,  b:45  } },
                            { name: 'cranberrybrown',    family: 'brown',  rgb: { r:96,  g:60,  b:57  } }, // custom
                            { name: 'gray',              family: 'gray',   rgb: { r:128, g:128, b:128 } },
                            { name: 'darkgray',          family: 'gray',   rgb: { r:169, g:169, b:169 } },
                            { name: 'dimgray',           family: 'gray',   rgb: { r:105, g:105, b:105 } },
                            { name: 'lightgray',         family: 'gray',   rgb: { r:211, g:211, b:211 } },
                            { name: 'slategray',         family: 'gray',   rgb: { r:112, g:128, b:144 } },
                            { name: 'green',             family: 'green',  rgb: { r:0,   g:128, b:0   } },
                            { name: 'darkgreen',         family: 'green',  rgb: { r:0,   g:100, b:0   } },
                            { name: 'darkolivegreen',    family: 'green',  rgb: { r:85,  g:107, b:47  } },
                            { name: 'forestgreen',       family: 'green',  rgb: { r:34,  g:139, b:34  } },
                            { name: 'greenyellow',       family: 'green',  rgb: { r:173, g:255, b:47  } },
                            { name: 'lawngreen',         family: 'green',  rgb: { r:124, g:252, b:0   } },
                            { name: 'lightgreen',        family: 'green',  rgb: { r:144, g:238, b:144 } },
                            { name: 'mediumspringgreen', family: 'green',  rgb: { r:0,   g:250, b:154 } },
                            { name: 'mediumseagreen',    family: 'green',  rgb: { r:60,  g:179, b:113 } },
                            { name: 'superdarkgreen',    family: 'green',  rgb: { r:0,   g:41,  b:0   } }, // custom
                            { name: 'seafoamgreen',      family: 'green',  rgb: { r:105, g:156, b:109 } }, // custom
                            { name: 'orange',            family: 'orange', rgb: { r:255, g:165, b:0   } },
                            { name: 'darkorange',        family: 'orange', rgb: { r:255, g:140, b:0   } },
                            { name: 'orangered',         family: 'orange', rgb: { r:255, g:69,  b:0   } },
                            { name: 'richorange',        family: 'orange', rgb: { r:198, g:54,  b:9   } },
                            { name: 'tomato',            family: 'orange', rgb: { r:255, g:99,  b:71  } },
                            { name: 'goldenrod',         family: 'orange', rgb: { r:218, g:165, b:32  } },
                            { name: 'pink',              family: 'pink',   rgb: { r:255, g:192, b:203 } },
                            { name: 'deeppink',          family: 'pink',   rgb: { r:255, g:20,  b:147 } },
                            { name: 'fuchsia',           family: 'pink',   rgb: { r:255, g:0,   b:255 } },
                            { name: 'hotpink',           family: 'pink',   rgb: { r:255, g:105, b:80  } },
                            { name: 'lightpink',         family: 'pink',   rgb: { r:255, g:182, b:193 } },
                            { name: 'violet',            family: 'pink',   rgb: { r:238, g:130, b:238 } },
                            { name: 'palevioletred',     family: 'pink',   rgb: { r:219, g:112, b:147 } },
                            { name: 'lavender',          family: 'pink',   rgb: { r:230, g:230, b:250 } },
                            { name: 'purple',            family: 'purple', rgb: { r:128, g:0,   b:128 } },
                            { name: 'indigo',            family: 'purple', rgb: { r:75,  g:0,   b:130 } },
                            { name: 'superdarkpurple',   family: 'purple', rgb: { r:41,  g:0,   b:41  } }, // custom
                            { name: 'plum',              family: 'purple', rgb: { r:221, g:160, b:221 } },
                            { name: 'red',               family: 'red',    rgb: { r:255, g:0,   b:0   } },
                            { name: 'darkred',           family: 'red',    rgb: { r:139, g:0,   b:0   } },
                            { name: 'indianred',         family: 'red',    rgb: { r:205, g:92,  b:92  } },
                            { name: 'tomatobisque',      family: 'red',    rgb: { r:198, g:51,  b:57  } }, // custom
                            { name: 'tan',               family: 'tan',    rgb: { r:210, g:180, b:140 } },
                            { name: 'wheat',             family: 'tan',    rgb: { r:245, g:222, b:179 } },
                            { name: 'sandybrown',        family: 'tan',    rgb: { r:244, g:164, b:96  } },
                            { name: 'khaki',             family: 'tan',    rgb: { r:240, g:230, b:140 } },
                            { name: 'rosybrown',         family: 'tan',    rgb: { r:188, g:143, b:143 } },
                            { name: 'yellow',            family: 'yellow', rgb: { r:255, g:255, b:0   } },
                            { name: 'yellowgreen',       family: 'yellow', rgb: { r:154, g:205, b:50  } },
                            { name: 'gold',              family: 'yellow', rgb: { r:255, g:215, b:0   } },
                            { name: 'sunflower',         family: 'yellow', rgb: { r:198, g:198, b:48  } }, // custom
                            { name: 'white',             family: 'white',  rgb: { r:255, g:255, b:255 } },
                            { name: 'antiquewhite',      family: 'white',  rgb: { r:250, g:235, b:215 } },
                            { name: 'cornsilk',          family: 'white',  rgb: { r:255, g:248, b:220 } }
                        ];

                        // find each colors closest color family
                        prominentColors.forEach(function(color){

                            // record distance calculations
                            var minimum = 9999;
                            var closest;

                            // calculate distance plots to determine the closest possible family match
                            families.forEach(function(familyColor){

                                // calculate color deltas
                                var deltaR = color.rgb.r - familyColor.rgb.r;
                                var deltaG = color.rgb.g - familyColor.rgb.g;
                                var deltaB = color.rgb.b - familyColor.rgb.b;

                                // calculate distance between extracted color and palette color
                                var distance = Math.sqrt((deltaR * deltaR) + (deltaG * deltaG) + (deltaB * deltaB));

                                // remember closest color distance proximity
                                if (distance < minimum){

                                    // shade variance
                                    var variance = Math.max.apply(255, _.values(color.rgb)) - Math.min.apply(0, _.values(color.rgb));
                                    var valid = false;

                                    // consider shade variance as a matching factor
                                    if (variance <= 15){

                                        // only allow shade families
                                        if (_.contains(['black','white','gray'], familyColor.family)){
                                            valid = true;
                                        }

                                    } else {
                                        
                                        if (_.contains(['black', 'white', 'gray'], familyColor.family)){

                                            // allow shade families
                                            if (variance <= 30){
                                                valid = true;
                                            }

                                        } else {

                                            // normal color families
                                            valid = true;

                                        }

                                    }

                                    if (valid){
                                        minimum = distance;
                                        closest = familyColor;
                                        closest.variance = variance;
                                    }
                                }

                            });

                            // add closest color
                            color.family = closest.family;
                            color.similar = closest.name;
                            color.variance = closest.variance;
                        });
                        */

                        /*
                        // calculate color family
                        prominentColors.forEach(function(prominentColor){
                            var family;
                            if (prominentColor.rgb.r === prominentColor.rgb.g === prominentColor.rgb.b){
                                family = 'neutral';
                            } else {
                                var closest = 360;
                                [
                                    { angle: 0,     label: 'red' },
                                    { angle: 30,    label: 'orange' },
                                    { angle: 60,    label: 'yellow' },
                                    { angle: 120,   label: 'green' },
                                    { angle: 210,   label: 'blue' },
                                    { angle: 270,   label: 'violet' }
                                ].forEach(function(hue){
                                    var distance = Math.abs(prominentColor.hsv.h - hue.angle);
                                    distance = (distance > 180) ? 360 - distance : distance;
                                    if (distance < closest){
                                        closest = distance;
                                        family = hue.label;
                                    }
                                });
                            }
                            prominentColor.family = family;
                        });
                        */

                        // done
                        callback(undefined, prominentColors);
                    });

                }
            });

        } else {

            // bow out
            callback('Image does not exist', undefined);
        }

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

