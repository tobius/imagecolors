var colormatch = require(__dirname+'/../main.js'),
    assert = require('assert');

colormatch.extract(__dirname + '/flower.jpg', function(err, data){

    if (err){
        console.log(err);
        process.exit(1);
    }

    console.log('data', data);

    assert.ok(data.length === 24);
    assert.ok(data[0].percent);
    assert.ok(data[0].rgb);

});

