[![build status](https://secure.travis-ci.org/soldair/node-colormatch.png)](http://travis-ci.org/soldair/node-colormatch)


## ColorMatch

Ever want to compare colors? ever want to extract colors from images? 
You can extract the dominant colors in an image with my extract.imageMagick function. (more libs comming soon)
You can use a matching algo that uses simple range math. Simple is nice!

If you index those colors in a system that has efficient range queries the output of the rgbRange function will be distinct r,g,b ranges that match visually


### API

####matching api

- quickMatch(rgb1,rgb2)
	do these colors match? this shows the logic required to use the provided rgb ranges and is useful for quick matching colors.
	rgb1 and rgb2 should be arrays with at least 3 int values in the format of [red,green,blue]

- rgbRange(r,g,b)
	this takes 3 arguments reg,green, and blue. it expects them to be ints.
	it returns an object. this object has keys r1,g1,b1 and r2,b2,g2 defined
		{r1:0,r2:0,g1:0,g2:0,b1:0,b2:0}
	to use this data all values in r between r1 and r2 are valid matches
	the same follows for g and b
	
- ColorMatch(options)
	this is the core object for color match right now. 
	The only reason you would want to make a new colormatch instance is to adjust the fuzzy tollerance applied to colors. 
	It is set to 15 points in the rgb space by default 

####extracting api

all values are nested under the main export .extract
the behavior of color extraction is to: 
1. reduce the colorspace in an image down to 16 colors
2. output how much of the image is that color.
3. output the data in a consistent format

example output:

	[{ percent: 9.996918248611745e-37, rgb: [ '70', '72', '62' ] }]

supported extractors

- imageMagick(path,callback)
	this shells out to convert (a part of the imageMagick suite)
	if you dont have it installed it wont work.


####desired extractors

node-canvas
js only png
js only jpeg





