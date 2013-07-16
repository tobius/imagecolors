var colormatch = require(__dirname+'/../main.js'),
    assert = require('assert');

// default palette test
colormatch.extractPalette(__dirname + '/photo.jpg', __dirname + '/palette.json', function(err, data){

    // imagemagick error
    if (err){
        throw new Error(err);
        process.exit(1);
    }

    // run tests
    assert.ok(data.length === 24);
    assert.ok(data[0].pixels);
    assert.ok(data[0].hex);
    assert.ok(data[0].hexContrast);
    assert.ok(data[0].rgb);
    assert.ok(data[0].hsl);
    assert.ok(data[0].hsv);
    assert.ok(data[0].cmyk);
    assert.ok(data[0].percent);
    assert.ok(data[0].family);

    // tests passed
    console.log('ok');

});

// custom color count test
colormatch.extractPalette(__dirname + '/photo.jpg', __dirname + '/palette.json', 10, function(err, data){

    // imagemagick error
    if (err){
        throw new Error(err);
        process.exit(1);
    }

    // run tests
    assert.ok(data.length === 10);
    assert.ok(data[0].pixels);
    assert.ok(data[0].hex);
    assert.ok(data[0].hexContrast);
    assert.ok(data[0].rgb);
    assert.ok(data[0].hsl);
    assert.ok(data[0].hsv);
    assert.ok(data[0].cmyk);
    assert.ok(data[0].percent);
    assert.ok(data[0].family);

    // tests passed
    console.log('ok');

});

