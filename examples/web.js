
// express
var _           = require('underscore'),
    express     = require('express'),
    fs          = require('fs'),
    imagecolors = require('imagecolors'),
    app         = express();

// template
var head = fs.readFileSync(__dirname + '/templates/head.tmpl', 'utf8');
var foot = fs.readFileSync(__dirname + '/templates/foot.tmpl', 'utf8');

// configure
app.configure(function(){

    // index
    app.get('/', function(req, res){

        var i, files, menu, photos;

        // find photos
        photos = [];
        files = fs.readdirSync(__dirname + '/public/photos/');
        for(i = files.length - 1; i > -1; i -= 1){
            if (/\.(gif|jpg|jpeg|png)$/i.test(files[i])){
                photos.push(files[i]);
            }
        }

        // generate menu
        menu = '';
        for(i = photos.length - 1; i > -1; i -= 1){
            menu += '<li><a href="/example.html?photo=' + photos[i] + '">' + photos[i] + '</a></li>';
        }

        // output
        res.send(head + '<strong>Examples</strong><ul>' + menu + '</ul>' + foot);

    });

    // examples
    app.get('/example.html', function(req, res){

        var photo = req.query.photo || null;

        if (photo !== null){

            // extract image colors
            imagecolors.extract(__dirname + '/public/photos/' + photo, 5, function(err, colors){

                var body = '<strong>Colors</strong><img src="/photos/' + photo + '" width="380"/><div class="container">';
                colors.forEach(function(color){
                    body += '<div class="color" data-family="' + color.family + '" data-luminance="' + color.luminance + '" data-pixels="' + color.pixels + '" data-percent="' + color.percent + '" style="color:' + color.labelHex + ';background-color:' + color.hex + '">';
                    body += '<strong>' + color.hex + '</strong> ' + color.family + ' family';
                    body += '</div>';
                });
                body += '</div><div style="clear:both; height:30px;"></div>';
                body += '<strong>Output</strong><div class="json">' + JSON.stringify(colors, null, 4) + '</div>';
                body += '<div style="clear:both;"></div>';

                res.send(head + body + foot);

            });

        } else {

            res.send('unknown photo');

        }

    });

    // static
    app.use(express.static(__dirname + '/public'));

});

// http server
app.listen(5000);

