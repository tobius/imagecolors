var colormatch = require(__dirname+'/../main.js'),
    assert = require('assert');

colormatch.extract(__dirname + '/flower.jpg', function(err, data){

    // imagemagick error
    if (err){
        throw new Error(err);
        process.exit(1);
    }

    // run tests
    assert.ok(data.length === 24);
    assert.ok(data[0].hex);
    assert.ok(data[0].percent);
    assert.ok(data[0].pixels);
    assert.ok(data[0].rgb);

    // tests passed
    console.log('ok');
    process.exit(0);

});

