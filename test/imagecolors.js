/* eslint-disable import/no-dynamic-require */

// external
const chai = require('chai');

// internal
const imagecolors = require(`${__dirname}/../main.js`);
const { spawn } = require('child_process');

// enable stack traces
chai.config.includeStack = true;

// use chai assert
const { assert } = chai;

describe('imagemagick', () => {
  it('should be installed', (done) => {
    // imagemagick command
    const convert = spawn('convert', ['--version']);
    convert.on('error', () => {
      console.info('brew install imagemagick');
      assert.ok(false);
      done();
    });
    convert.on('close', () => {
      assert.ok(true);
      done();
    });
  });
});

describe('require("imagecolors")', () => {
  it('should be a valid object', () => {
    assert.ok(imagecolors);
    assert.ok(typeof imagecolors === 'object');
  });

  describe('imagecolors.extract()', () => {
    it('should be a valid method', () => {
      assert.ok(imagecolors.extract);
      assert.ok(typeof imagecolors.extract === 'function');
    });

    it('should return error when a local file does not exist', (done) => {
      imagecolors.extract('./doesnotexist.nowaynohow', 8, (err) => {
        assert.ok(err);
        done();
      });
    });

    it('should extract valid color properties from a local image', (done) => {
      const asset = `${__dirname}/octocat.png`;
      imagecolors.extract(asset, 8, (err, colors) => {
        assert.notOk(err);
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
        done();
      });
    });

    it('should return error when extracting color properties from a local non-image', (done) => {
      const asset = `${__dirname}/lorem.txt`;
      imagecolors.extract(asset, 8, (err) => {
        assert.ok(err);
        done();
      });
    });

    it('should extract valid color properties from a remote image', (done) => {
      const asset = 'https://octodex.github.com/images/original.png';
      imagecolors.extract(asset, 8, (err, colors) => {
        assert.notOk(err);
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
        done();
      });
    });

    it('should return error when extracting color properties from a remote non-image', (done) => {
      const asset = 'http://octodex.github.com/';
      imagecolors.extract(asset, 8, (err) => {
        assert.ok(err);
        done();
      });
    });
  });

  describe('imagecolors.convert()', () => {
    let testcolors;
    beforeEach((done) => {
      const asset = `${__dirname}/octocat.png`;
      imagecolors.extract(asset, 8, (err, colors) => {
        testcolors = colors;
        done();
      });
    });

    it('should be a valid method', () => {
      assert.ok(imagecolors.convert);
      assert.ok(typeof imagecolors.convert === 'function');
    });

    it('should convert valid color properties from a valid json color palette', (done) => {
      const palette = `${__dirname}/palette.json`;
      imagecolors.convert(testcolors, palette, (err, colors) => {
        assert.notOk(err);
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
        done();
      });
    });

    it('should return error when converting color properties from an invalid json color palette', (done) => {
      const palette = `${__dirname}/lorem.txt`;
      imagecolors.convert(testcolors, palette, (err) => {
        assert.ok(err);
        done();
      });
    });
  });

});

