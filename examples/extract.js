// required modules
var _ = require('underscore'),
    fs = require('fs'),
    imagecolors = require(__dirname + '/../main.js');

// html includes
var head = fs.readFileSync(__dirname + '/templates/head.tmpl', 'utf8') + '<h1>imagecolors</h1>';
var foot = fs.readFileSync(__dirname + '/templates/foot.tmpl', 'utf8');

// test images
var images = [ 'bluejay', 'borealis', 'country', 'crescent', 'filoli', 'fish', 'flower', 'googleglass', 'parrot', 'petals', 'puppy', 'soccer', 'tigers' ];

// other vars
var entries = {};
var done = false;

// sort by key so mutliple tests will organize the same way
var sortByKey = function(map){
    var keys = _.sortBy(_.keys(map), function(a) { return a; });
    var newmap = {};
    _.each(keys, function(k) {
        newmap[k] = map[k];
    });
    return newmap;
};

// do each one
images.forEach(function(image){

    // extract image colors
    imagecolors.extract(__dirname + '/photos/' + image + '.jpg', 12, function(err, colors){

        // sort by percent
        colors = _.sortBy(colors, function(color){
            return -(color.percent);
        });

        // build html test
        var body = '<h3>' + colors.length + ' colors sorted by <span id="sortkey">percent</span></h3><img src="' + (__dirname + '/photos/' + image + '.jpg') + '" width="380"/><div class="container">';
        colors.forEach(function(color){
            body += '<div class="color" data-family="' + color.family + '" data-luminance="' + color.luminance + '" data-pixels="' + color.pixels + '" data-percent="' + color.percent + '" style="color:' + color.labelHex + ';background-color:' + color.hex + '">';
            body += '<strong>' + color.hex + ' (' + color.family + ' - ' + color.similar + ')</strong> {';
            body += 'hex: ' + color.hex + ', ';
            body += 'family: ' + color.family + ', ';
            body += 'rgb(' + _.values(color.rgb).join(',') + '), ';
            body += 'cmyk(' + _.values(color.cmyk).join(',') + '), ';
            body += 'hsv(' + _.values(color.hsv).join(',') + '), ';
            body += 'hsl(' + _.values(color.hsl).join(',') + '), ';
            body += 'luminance: ' + color.luminance + ', ';
            body += 'variance: ' + color.variance + ', ';
            body += 'pixels: ' + color.pixels + ' (' + color.percent + '%)}';
            //body += JSON.stringify(color, null, 4);
            body += '</div>';
        });
        body += '</div><div style="clear:both;"></div>';

        // append to collection
        entries[image] = body;

        if (_.keys(entries).length === images.length && !done){

            // prevent async process from fighting over last rites
            done = true;

            // write html test file
            fs.writeFileSync(__dirname + '/extract.html', head + _.values(sortByKey(entries)).join('') + foot, 'utf8');

            // notify user
            console.log('done');
            console.log('open ' + __dirname + '/extract.html');

        }

    });

});

