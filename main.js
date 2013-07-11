var im = require('imagemagick');

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

        // call imagemagick
        im.convert(
            [image, '+dither', '-colors', colors, '-depth', 8, '-format', '#%c"', 'histogram:info:'],
            function(err, stdout){
                if (err){

                    // imagemagick error
                    callback(err, undefined);

                } else {

                    // clean up histogram
                    var histogram = stdout.trim().replace(/^[^\s]+(.*)[^\s]+$/m, '$1').split('\n');
                    histogram.pop();

                    // read prominent colors
                    var prominentcolors = [];
                    var total = 0;
                    histogram.forEach(function(colordata){

                        // imagemagick color output
                        var colordata = colordata.replace(/\s+/g, '');
                        var match = /(\d+):\(([\d,]+)\)#([A-F0-9]+)srgb\(([\d,]+)/.exec(colordata);
                        if (!match){

                            // imagemagick black output (gets handled differently)
                            match = /(\d+):\(([\d,]+)\)#(000000)(bl)/.exec(colordata);
                            if (match){
                                match[2] = '0,0,0';
                            }

                        }

                        // push prominent colors
                        if (match){
                            var pixels = parseInt(match[1], 10);
                            prominentcolors.push({
                                hex     : match[3],
                                rgb     : match[2].split(',').map(function(x){return parseInt(x)}),
                                pixels  : pixels
                            });
                            total += pixels;
                        }

                    });

                    // calculate pixel percentage
                    prominentcolors.forEach(function(color){
                        color.percent = Math.round(((color.pixels/total)*100)*100)/100;
                    });

                    // done
                    callback(undefined, prominentcolors);

                }
            }
        );

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

                    // matched sherwin colors
                    var sherwindata = [];

                    // process each extracted color
                    colordata.forEach(function(color){

                        // record distance calculations
                        var minimum = 9999;
                        var closest = undefined;

                        // calculate distance plots to determine the closest possible palette match
                        // process each palette color
                        palette.forEach(function(palettecolor){

                            // calculate color deltas
                            var delta_r = color.rgb[0] - palettecolor.rgb[0];
                            var delta_g = color.rgb[1] - palettecolor.rgb[1];
                            var delta_b = color.rgb[2] - palettecolor.rgb[2];

                            // calculate distance between extracted color and palette color
                            var distance = Math.sqrt((delta_r * delta_r) + (delta_g * delta_g) + (delta_b * delta_b));

                            // remember closest color distance proximity
                            if (distance < minimum){
                                minimum = distance;
                                closest = palettecolor;

                                // calculate a custom color scale value (useful for custom sorting)
                                closest.scale = Math.round((Math.sqrt(closest.rgb[0] + closest.rgb[1] + closest.rgb[2]))*100)/100;
                            }

                        });

                        // combine extracted properties with palette properties
                        closest.pixels = color.pixels;
                        closest.percent = color.percent;

                        // @todo: generate a label friendly color (for test output)
                        //closest.label = generateLabelColor(closest.hex);

                        // add closest color
                        sherwindata.push(closest);
                    });

                    // done
                    callback(undefined, sherwindata);

                }
            });

        } catch(err){

            // palette error
            callback(err, undefined);

        }

    }

};

