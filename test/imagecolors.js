var imagecolors = require(__dirname+'/../main.js'),
    assert = require('assert');

var assets = [__dirname + '/octocat.png', 'http://octodex.github.com/images/original.png'];

assets.forEach(function(asset){

    imagecolors.extract(asset, 10, function(err, colors){

        // extraction error
        if (err){
            throw new Error(err);
            process.exit(1);
        }

        // run tests
        assert.ok(colors.length === 10);
        assert.ok(colors[0].pixels);
        assert.ok(colors[0].hex);
        assert.ok(colors[0].labelHex);
        assert.ok(colors[0].rgb);
        assert.ok(colors[0].hsl);
        assert.ok(colors[0].hsv);
        assert.ok(colors[0].cmyk);
        assert.ok(colors[0].luminance);
        assert.ok(colors[0].percent);
        assert.ok(colors[0].family);

        // test convert
        imagecolors.convert(colors, __dirname + '/palette.json', function(err, customColors){

            // conversion error
            if (err){
                throw new Error(err);
                process.exit(1);
            }

            // run tests
            assert.ok(colors.length === 10);
            assert.ok(colors[0].pixels);
            assert.ok(colors[0].hex);
            assert.ok(colors[0].labelHex);
            assert.ok(colors[0].rgb);
            assert.ok(colors[0].hsl);
            assert.ok(colors[0].hsv);
            assert.ok(colors[0].cmyk);
            assert.ok(colors[0].luminance);
            assert.ok(colors[0].percent);
            assert.ok(colors[0].family);

            // tests passed
            console.log('ok');
        });
    });

});

