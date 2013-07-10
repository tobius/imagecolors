
# colormatch

A node module that extracts colors from an image using the color quantization algorithms built into ImageMagick.

## Usage

````
[~/myproject] npm install git://github.com/tobius/colormatch.git
````

````javascript
// colormatch
var colormatch = require('colormatch');

// extract
colormatch.extract('flower.jpg', function(err, colors){
    if (!err){
        console.log(colors);
    }
});
````

