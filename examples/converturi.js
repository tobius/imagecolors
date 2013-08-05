// required modules
var _ = require('underscore'),
    fs = require('fs'),
    imagecolors = require(__dirname + '/../main.js');

// html includes
var head = fs.readFileSync(__dirname + '/templates/head.tmpl', 'utf8') + '<h1>imagecolors</h1>';
var foot = fs.readFileSync(__dirname + '/templates/foot.tmpl', 'utf8');

// test uris
var uris = [ 
    'http://static6.businessinsider.com/image/51dc7b9b6bb3f77d37000021/11-crazy-photos-from-the-world-bodypainting-festival-in-austria.jpg',
    'http://marathistars.com/wp-content/uploads/2012/12/Ketaki-Chitale-real-Photos.jpg',
    'http://www.globalpost.com/sites/default/files/imagecache/gp3_fullpage/best_sports_photos_week_dec_8_1.jpg'
];

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
uris.forEach(function(uri){

    // extract uri colors
    imagecolors.extract(uri, 5, function(err, colors){

        // convert to custom palette
        imagecolors.convert(colors, __dirname + '/palette.json', function(err, colors){

            // sort by percent
            colors = _.sortBy(colors, function(color){
                return -(color.percent);
            });

            // build html test
            var body = '<h3>' + colors.length + ' colors sorted by <span id="sortkey">percent</span></h3><img src="' + uri + '" width="380"/><div class="container">';
            colors.forEach(function(color){
                body += '<div class="color" data-family="' + color.family + '" data-luminance="' + color.luminance + '" data-pixels="' + color.pixels + '" data-percent="' + color.percent + '" style="color:' + color.labelHex + ';background-color:' + color.hex + '">';
                body += '<strong>' + color.hex + '</strong> {';
                body += 'hex: ' + color.hex + ', ';
                body += 'family: ' + color.family + ', ';
                body += 'rgb(' + _.values(color.rgb).join(',') + '), ';
                body += 'cmyk(' + _.values(color.cmyk).join(',') + '), ';
                body += 'hsv(' + _.values(color.hsv).join(',') + '), ';
                body += 'hsl(' + _.values(color.hsl).join(',') + '), ';
                body += 'luminance: ' + color.luminance + ', ';
                body += 'pixels: ' + color.pixels + ' (' + color.percent + '%)}';
                //body += JSON.stringify(color, null, 4);
                body += '</div>';
            });
            body += '</div><div style="clear:both;"></div>';

            // append to collection
            entries[uri] = body;

            if (_.keys(entries).length === uris.length && !done){

                // prevent async process from fighting over last rites
                done = true;

                // write html test file
                fs.writeFileSync(__dirname + '/converturi.html', head + _.values(sortByKey(entries)).join('') + foot, 'utf8');

                // notify user
                console.log('done');
                console.log('open ' + __dirname + '/converturi.html');

            }
        });

    });

});

