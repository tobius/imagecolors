var colormatch = require(__dirname+'/../main.js');

// custom color count test
colormatch.extract(__dirname + '/photo.jpg', 10, function(err, data){

    // imagemagick error
    if (err){
        throw new Error(err);
        process.exit(1);
    }

    // output data
    console.log(data);

});

