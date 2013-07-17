// required modules
var color = require('color'),
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
        var imageStats = fs.lstatSync(imagePath);

        // confirm that file exists
        if (imageStats.isFile()){

            // tmp dir (heroku compatible)
            var tmpFile = imagePath.replace(/^.*?([^\/]+?)$/g, '$1');
            var tmpPath = imagePath.replace(/^(.*?)\/[^\/]+?$/g, '$1') + '/tmp/' + tmpFile + '.miff';

            // use imagemagick to simplify image
            var image = im(imagePath).noProfile().bitdepth(8).colors(numColors);

            // extract histogram from image
            image.write('histogram:' + tmpPath, function(err){
                if (!err){

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

        } else {

            // bow out
            callback('Palette does not exist', undefined);

        }

    }

};

