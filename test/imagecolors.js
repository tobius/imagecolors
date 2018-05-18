
var assert, chai, imagecolors, spawn, testcolors;

// modules
chai        = require('chai');
imagecolors = require(__dirname + '/../main.js');
spawn       = require('child_process').spawn;

// enable stack traces
chai.Assertion.includeStack = true;

// use chai assert
assert = chai.assert;

describe('imagemagick', function(){

    it('should be installed', function(done){

        // most of this module is based on imagemagick
        var convert = spawn('convert', ['--version']);

        // bad
        convert.on('error', function(huh){
            console.log('brew install imagemagick');
            assert.ok(false);
            done();
        });

        // good
        convert.on('close', function(code){
            assert.ok(true);
            done();
        });

    });

});

describe('require("imagecolors")', function(){

    it('should be a valid object', function(){
        assert(imagecolors !== undefined, 'must be defined');
        assert(typeof imagecolors === 'object', 'must be an object');
    });

    describe('imagecolors.extract()', function(){

        it('should be a valid method', function(){
            assert(imagecolors.extract !== undefined, 'must be defined');
            assert(typeof imagecolors.extract === 'function', 'must be a function');
        });

        it('should extract valid color properties from a local image', function(done){

            var asset = __dirname + '/octocat.png';

            imagecolors.extract(asset, 8, function(err, colors){

                // extraction error
                assert.notOk(err);

                // run tests
                assert.ok(colors.length === 8);
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

                // continue testing
                done();

            });

        });

        it('should return error when extracting color properties from a local non-image', function(done){

            var asset = __dirname + '/lorem.txt';

            imagecolors.extract(asset, 8, function(err, colors){

                // extraction error
                assert.ok(err);

                // continue testing
                done();

            });

        });

        it('should extract valid color properties from a remote image', function(done){

            var asset = 'https://octodex.github.com/images/original.png';

            imagecolors.extract(asset, 8, function(err, colors){

                // extraction error
                assert.notOk(err);

                // run tests
                assert.ok(colors.length === 8);
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

                // continue testing
                done();

            });

        });

        it('should return error when extracting color properties from a remote non-image', function(done){

            var asset = 'http://octodex.github.com/';

            imagecolors.extract(asset, 8, function(err, colors){

                // extraction error
                assert.ok(err);

                // continue testing
                done();

            });

        });

    });

    describe('imagecolors.convert()', function(){

        beforeEach(function(done){

            var asset = __dirname + '/octocat.png';

            imagecolors.extract(asset, 8, function(err, colors){

                // set test colors
                testcolors = colors;

                // continue testing
                done();

            });

        });

        it('should be a valid method', function(){
            assert(imagecolors.convert !== undefined, 'must be defined');
            assert(typeof imagecolors.convert === 'function', 'must be a function');
        });

        it('should convert valid color properties from a valid json color palette', function(done){

            var palette = __dirname + '/palette.json';

            imagecolors.convert(testcolors, palette, function(err, colors){

                // extraction error
                assert.notOk(err);

                // run tests
                assert.ok(colors.length === 8);
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

                // continue testing
                done();

            });

        });

        it('should return error when converting color properties from an invalid json color palette', function(done){

            var palette = __dirname + '/lorem.txt';

            imagecolors.convert(testcolors, palette, function(err, colors){

                // extraction error
                assert.ok(err);

                // continue testing
                done();

            });

        });

    });

});

