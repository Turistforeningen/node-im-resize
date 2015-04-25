var exec = require('child_process').exec, child;
var aspect = require('aspectratio');
var dirname = require('path').dirname;
var basename = require('path').basename;
var join = require('path').join;
var sprintf = require('util').format;

module.exports = function(image, versions, cb) {
  var cmd = module.exports.cmd(image, versions);
  exec(cmd, {timeout: 10000}, function(e, stdout, stderr) {
    if (e) { return cb(e); }
    if (stderr) { return cb(new Error(stderr)); }

    return cb(null, versions);
  });
};

/**
 * Get cropped geometry for given aspectratio
 *
 * @param string image - original image metadata
 * @param string ratio - new aspect ratio
 *
 * @return string geometry; false if no crop applies
 */
module.exports.crop = function(image, ratio) {
  if (!ratio) { return false; }

  var g = aspect.fixed(image.width, image.height, ratio);

  // Check if the image already has the decired aspectratio.
  if (g[0] === 0 && g[1] === 0) {
    return false;
  } else {
    return g[2] + 'x' + g[3]  + '+' + g[0] + '+' + g[1];
  }
};

/**
 * Get new path with suffix
 *
 * @param string src- image path
 * @param string ratio - path suffix
 *
 * @return string path
 */
module.exports.path = function(path, suffix) {
  var d = dirname(path);
  var b = basename(path);

  return join(d, b.split('.', 2).join(suffix + '.'));
};

/**
 * Get convert command
 *
 * @param object image - original image object
 * @param Array versions - derivated versions
 *
 * @return string convert command
 */
module.exports.cmd = function(image, versions) {
  var cmd = [
    sprintf(
      'convert %s -quality 80 -strip -write mpr:%s +delete',
      image.path,
      image.path
    )
  ];

  for (var i = 0; i < versions.length; i++) {
    // http://www.imagemagick.org/Usage/files/#mpr
    cmd.push(sprintf('mpr:%s', image.path));

    // -crop
    var crop = module.exports.crop(image, versions[i].aspect);
    if (crop) {
      cmd.push(sprintf('-crop "%s"', crop));
    }

    // -resize
    cmd.push(
      sprintf(
        '-resize "%dx%d"',
        versions[i].maxWidth,
        versions[i].maxHeight
      )
    );

    // -write
    versions[i].path = module.exports.path(image.path, versions[i].suffix);
    if (i === versions.length - 1) {
      cmd.push(versions[i].path);
    } else {
      cmd.push(sprintf('-write %s +delete', versions[i].path));
    }
  }

  return cmd.join(' ');
};
