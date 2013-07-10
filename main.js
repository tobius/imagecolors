var im = require('imagemagick');

// exported module
module.exports = {

    /**
     * extract the top 24 colors of an image file
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
     * @param [String] image
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

    }
};

