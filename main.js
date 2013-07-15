//var im = require('imagemagick');
var Color = require('color'),
    fs = require('fs'),
    gm = require('gm'),
    im = gm.subClass({imageMagick: true});

// exported module
module.exports = {

    /**
     * extract prominent colors from an image file
     *
     * Usage:
     *
     * var colormatch = require('colormatch');
     *
     * // 24 colors
     * var colors = colormatch.extract('photo.jpg', function(err, data){
     *     if (!err){
     *         console.log(data);
     *     }
     * });
     *
     * // 8 colors
     * var colors = colormatch.extract('photo.jpg', 8, function(err, data){
     *     if (!err){
     *         console.log(data);
     *     }
     * });
     *
     * @param [String] image (png|jpg|gif)
     * @param [Number] colors (optional)
     * @param [Function] callback
     */
    extract: function(image){

        // args
        var colors = (arguments.length > 2) ? arguments[1] : 24;
        var callback = (arguments.length > 2) ? arguments[2] : arguments[1];

        // prepare tmp file
        var tmpFile = image.replace(/^.*?([^\/]+?)$/g, '$1');
        var tmpPath = image.replace(/^(.*?)\/[^\/]+?$/g, '$1') + '/tmp/' + tmpFile + '.miff';

        // call gm/im
        im(image)
            .noProfile()
            .bitdepth(8)
            .colors(colors)
            .write('histogram:' + tmpPath, function(err){
                if (err){

                    // graphicsmagick error
                    callback(err, undefined);

                } else {

                    // build histogram
                    var histogram = '';
                    var miff = fs.createReadStream(tmpPath, {encoding: 'utf8'});

                    // add to histogram
                    miff.addListener('data', function(chunk){
                        histogram += chunk;
                    });

                    // clean up
                    miff.addListener('close', function(){
                        fs.unlink(tmpPath);
                        
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
                            var obj = Color(hex);
                            prominentColors.push({
                                pixels  : pixels,
                                hex     : hex,
                                rgb     : obj.rgb(),
                                hsl     : obj.hsl(),
                                hsv     : obj.hsv(),
                                cmyk    : obj.cmyk()
                            });
                            totalPixels += pixels;
                        });
 
                        // calculate pixel percentage
                        prominentColors.forEach(function(prominentColor){
                            prominentColor.percent = Math.round(((prominentColor.pixels/totalPixels)*100)*100)/100;
                        });

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

                        // done
                        callback(undefined, prominentColors);
                    });

                }
            });
    },

    /**
     * extract closest matching palette colors from an image file
     *
     * Usage:
     *
     * var colormatch = require('colormatch');
     *
     * // 24 colors
     * var colors = colormatch.extractPalette('photo.jpg', 'palette.json', function(err, data){
     *     if (!err){
     *         console.log(data);
     *     }
     * });
     *
     * // 8 colors
     * var colors = colormatch.extractPalette('photo.jpg', 'palette.json', 8, function(err, data){
     *     if (!err){
     *         console.log(data);
     *     }
     * });
     *
     * @param [String] image (png|jpg|gif)
     * @param [String] palette (JSON)
     * @param [Number] colors (optional)
     * @param [Function] callback
     */
    extractPalette: function(image, palette){

        // args
        var colors = (arguments.length > 3) ? arguments[2] : 24;
        var callback = (arguments.length > 3) ? arguments[3] : arguments[2];

        // load color palette
        try {

            // use built-in JSON support
            palette = require(palette);

            // local extraction
            this.extract(image, colors, function(err, colordata){
                if (err){

                    // extract error
                    callback(err, undefined);

                } else {

                    // matched custom colors
                    var customdata = [];

                    // process each extracted color
                    colordata.forEach(function(color){

                        // record distance calculations
                        var minimum = 9999;
                        var closest = undefined;

                        // calculate distance plots to determine the closest possible palette match
                        // process each palette color
                        palette.forEach(function(palettecolor){

                            // calculate color deltas
                            var delta_r = color.rgb.r - palettecolor.rgb.r;
                            var delta_g = color.rgb.g - palettecolor.rgb.g;
                            var delta_b = color.rgb.b - palettecolor.rgb.b;

                            // calculate distance between extracted color and palette color
                            var distance = Math.sqrt((delta_r * delta_r) + (delta_g * delta_g) + (delta_b * delta_b));

                            // remember closest color distance proximity
                            if (distance < minimum){
                                minimum = distance;
                                closest = palettecolor;

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

                        // @todo: generate a label friendly color (for test output)
                        //closest.label = generateLabelColor(closest.hex);

                        // add closest color
                        customdata.push(closest);
                    });

                    // done
                    callback(undefined, customdata);

                }
            });

        } catch(err){

            // palette error
            callback(err, undefined);

        }

    }

};

