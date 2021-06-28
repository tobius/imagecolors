// express
const express = require('express');
const fs = require('fs');
const imagecolors = require('imagecolors');

// init
const app = express();

// template
const head = fs.readFileSync(`${__dirname}/templates/head.tmpl`, 'utf8');
const foot = fs.readFileSync(`${__dirname}/templates/foot.tmpl`, 'utf8');

// index
app.get('/', (req, res) => {
  let i;

  // find photos
  const photos = [];
  const files = fs.readdirSync(`${__dirname}/public/photos/`);
  for (i = files.length - 1; i > -1; i -= 1) {
    if (/\.(gif|jpg|jpeg|png)$/i.test(files[i])) {
      photos.push(files[i]);
    }
  }

  // generate menu
  let menu = '';
  for (i = photos.length - 1; i > -1; i -= 1) {
    menu += `<li><a href="/example.html?photo=${photos[i]}">${photos[i]}</a></li>`;
  }

  // output
  res.send(`${head}<strong>Examples</strong><ul>${menu}</ul>${foot}`);
});

// examples
app.get('/example.html', (req, res) => {
  const photo = req.query.photo || null;
  if (photo === null) {
    return res.send('unknown photo');
  }
  imagecolors.extract(`${__dirname}/public/photos/${photo}`, 5, (err, colors) => {
    if (err) {
      return res.send(err.message);
    }
    let body = `<strong>Colors</strong><img src="/photos/${photo}" width="380"/><div class="container">`;
    colors.forEach((color) => {
      body += [
        `<div class="color" data-family="${color.family}"`,
        ` data-luminance="${color.luminance}"`,
        ` data-pixels="${color.pixels}"`,
        ` data-percent="${color.percent}"`,
        ` style="color:${color.labelHex};background-color:${color.hex}">`,
        `<strong>${color.hex}</strong> ${color.family} family`,
        '</div>',
      ].join('');
    });
    body += [
      '</div><div style="clear:both; height:30px;"></div>',
      `<strong>Output</strong><div class="json">${JSON.stringify(colors, null, 4)}</div>`,
      '<div style="clear:both;"></div>',
    ].join('');
    res.send(`${head}${body}${foot}`);
  });
});

// static
app.use(express.static(`${__dirname}/public`));

// http server
app.listen(5000);
