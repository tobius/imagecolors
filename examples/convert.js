// required modules
var _ = require('underscore'),
    fs = require('fs'),
    imagecolors = require(__dirname + '/../main.js');

// html includes
var head = fs.readFileSync(__dirname + '/templates/head.tmpl', 'utf8');
var foot = fs.readFileSync(__dirname + '/templates/foot.tmpl', 'utf8');

// extract image colors
imagecolors.extract(__dirname + '/photo.jpg', 6, function(err, colors){

    // convert to custom palette
    imagecolors.convert(colors, __dirname + '/palette.json', function(err, colors){

        // sort by percent
        colors = _.sortBy(colors, function(color){
            return -(color.percent);
        });

        // build html test
        var body = '<h1>imagecolors</h1><h3>' + colors.length + ' colors sorted by <span id="sortkey">percent</span></h3><img src="' + (__dirname + '/photo.jpg') + '" width="380"/><div class="container">';
        colors.forEach(function(color){
            body += '<div class="color" data-family="' + color.family + '" data-luminance="' + color.luminance + '" data-pixels="' + color.pixels + '" data-percent="' + color.percent + '" style="color:' + color.labelHex + ';background-color:' + color.hex + '">';
            body += '<strong>' + color.hex + '</strong> {';
            body += 'family: ' + color.family + ', ';
            body += 'rgb(' + _.values(color.rgb).join(',') + '), ';
            body += 'cmyk(' + _.values(color.cmyk).join(',') + '), ';
            body += 'hsv(' + _.values(color.hsv).join(',') + '), ';
            body += 'hsl(' + _.values(color.hsl).join(',') + '), ';
            body += 'luminance: ' + color.luminance + ', ';
            body += 'pixels: ' + color.pixels + ' (' + color.percent + '%)}';
            //body += JSON.stringify(color, null, 4);
            body += '</div></div>';
        });

        // write html test file
        fs.writeFileSync(__dirname + '/convert.html', head + body + foot, 'utf8');

    });

});

console.log('done');
console.log('open ' + __dirname + '/convert.html');

