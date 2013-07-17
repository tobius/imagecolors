var imagecolors = require(__dirname+'/../main.js');

// custom color count test
imagecolors.extract(__dirname + '/photo.jpg', 10, function(err, data){

    // extraction error
    if (err){
        throw new Error(err);
        process.exit(1);
    }

    // output data
    console.log(data);

});

