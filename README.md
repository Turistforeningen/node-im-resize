# im-resize

[![Build status](https://img.shields.io/wercker/ci/553c052c1f74af18461065db.svg "Build status")](https://app.wercker.com/project/bykey/de024521812381e9c956d9c8fee3c3c4)
[![NPM downloads](https://img.shields.io/npm/dm/im-resize.svg "NPM downloads")](https://www.npmjs.com/package/im-resize)
[![NPM version](https://img.shields.io/npm/v/im-resize.svg "NPM version")](https://www.npmjs.com/package/im-resize)
[![Node version](https://img.shields.io/node/v/im-resize.svg "Node version")](https://www.npmjs.com/package/im-resize)
[![Dependency status](https://img.shields.io/david/turistforeningen/node-im-resize.svg "Dependency status")](https://david-dm.org/turistforeningen/node-im-resize)

Efficient image resize with support for multiple thumbnail configurations using
ImageMagick's [`convert`](http://imagemagick.org/www/convert.html) command.

## Requirements

* ImageMagick

## Install

```
npm install im-resize --save
```

## API

```js
var resize = require('im-resize');
```

### resize(**object** `image`, **object** `output`, **function** `cb`)

Resize a given source `image` into several `versions`.

* **object** `image` - source image to resize
  * **integer** `width` - image pixel width
  * **integer** `height` - image pixel height
  * **string** `path` - complete path to source image
* **object** `output` - image resize output config
  * **string** `prefix` image versions name prefix (default `""`)
  * **string** `path` image versions directory path
  * **integrer** `quality` - global version quality (default `80`)
  * **object[]** `versions` - array of version objects
    * **string** `suffix` - suffix for the resized image (ex. `-small`)
    * **integer** `maxWidth` - max width for resized image
    * **integer** `maxHeight` - max height for resized image
    * **integer** `quality` - quality for resized image (default `80`)
    * **string** `aspect` - force aspectratio on resized image (ex. `4:3`)
    * **boolean** `flatten` - used in conjunction with background
    * **string** `background` - set background to transparent image (ex. `red`)
    * **string** `format` - image format for resized image (ex. `png`)
* **function** `cb` - callback function (**Error** `error`, **object[]** `versions`)
  * **Error** `error` - error output if command failed
  * **object[]** `versions` - resized image versions
    * **string** `path` path to the resized image

#### Example

```js
var image = {
  path: '/path/to/image.jpg',
  width: 5184,
  height: 2623
};

var output = {
  versions: [{
    suffix: '-thumb',
    maxHeight: 150,
    maxWidth: 150,
    aspect: "3:2"
  },{
    suffix: '-square',
    maxWidth: 200,
    aspect: "1:1"
  }]
};

resize(image, output, function(error, versions) {
  if (error) { console.error(error); }
  console.log(versions[0].path);   // /path/to/image-thumb.jpg
  console.log(versions[0].width);  // 150
  console.log(versions[0].height); // 100

  console.log(versions[1].path);   // /path/to/image-square.jpg
  console.log(versions[1].width);  // 200
  console.log(versions[1].height); // 200
});
```

## [MIT License](https://github.com/Turistforeningen/node-im-resize/blob/master/LICENSE)
