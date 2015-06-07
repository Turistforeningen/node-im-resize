/*jshint laxbreak:true */

var assert = require('assert');
var resize = require('./index');

describe('resize.path()', function() {
  it('returns new relative path with suffix', function() {
    var path = resize.path('./foo.jpg', {prefix: '', suffix: '-bar'});

    assert.equal(path, 'foo-bar.jpg');
  });

  it('returns new relative path with custom format', function() {
    var path = resize.path('./foo.jpg', {
      prefix: '',
      suffix: '-bar',
      format: 'png'
    });

    assert.equal(path, 'foo-bar.png');
  });

  it('returns new absolute path with suffix', function() {
    var path = resize.path('/foo/bar/baz.jpg', {prefix: '', suffix: '-bix'});
    assert.equal(path, '/foo/bar/baz-bix.jpg');
  });

  it('returns new absolute path with custom format', function() {
    var path = resize.path('/foo/bar/baz.jpg', {
      prefix: '',
      suffix: '-bix',
      format: 'png'
    });

    assert.equal(path, '/foo/bar/baz-bix.png');
  });

  it('returns new path with prefix', function() {
    var path = resize.path('/foo/bar/baz.jpg', {prefix: 'prefix-', suffix: ''});
    assert.equal(path, '/foo/bar/prefix-baz.jpg');
  });

  it('returns new path with custom directory', function() {
    var path = resize.path('/foo/bar/baz.jpg', {
      prefix: 'im-',
      suffix: '',
      path: '/tmp'
    });

    assert.equal(path, '/tmp/im-baz.jpg');
  });
});

describe('resize.crop()', function() {
  it('returns crop geometry for horisontal image', function() {
    var image = {width: 5184, height: 2623};
    assert.equal(resize.crop(image, '3:2'), '3936x2623+624+0');
  });

  it('returns crop geometry for vertical image', function() {
    var image = {height: 5184, width: 2623};
    assert.equal(resize.crop(image, '3:2'), '2623x3936+0+624');
  });

  it('returns false for image with correct aspectratio', function() {
    var image = {width: 2000, height: 1000};
    assert.equal(resize.crop(image, '2:1'), false);
  });

  it('returns false if no aspectratio is defined', function() {
    var image = {width: 2000, height: 1000};
    assert.equal(resize.crop(image), false);
  });
});

describe('resize.cmd()', function() {
  var output, image;

  beforeEach(function() {
    image = {
      path: './assets/horizontal.jpg',
      width: 5184,
      height: 2623
    };

    output = {
      versions: [{
        suffix: '-full',
        maxHeight: 1920,
        maxWidth: 1920
      },{
        suffix: '-1200',
        maxHeight: 1200,
        maxWidth: 1200,
        aspect: "3:2"
      }]
    };
  });

  it('sets global path to each version', function() {
    output.path = '/tmp';
    resize.cmd(image, output);

    assert.equal(output.versions[0].path, '/tmp/horizontal-full.jpg');
    assert.equal(output.versions[1].path, '/tmp/horizontal-1200.jpg');
  });

  it('sets global prefix to each version', function() {
    output.prefix = 'im-';
    resize.cmd(image, output);

    assert.equal(output.versions[0].path, 'assets/im-horizontal-full.jpg');
    assert.equal(output.versions[1].path, 'assets/im-horizontal-1200.jpg');
  });

  it('sets default quality to each version', function() {
    resize.cmd(image, output);

    assert.equal(output.versions[0].quality, 80);
    assert.equal(output.versions[1].quality, 80);
  });

  it('sets global quality to each version', function() {
    output.quality = 20;
    resize.cmd(image, output);

    assert.equal(output.versions[0].quality, 20);
    assert.equal(output.versions[1].quality, 20);
  });

  it('preserves local version quality', function() {
    output.quality = 30;
    output.versions[1].quality = 99;

    resize.cmd(image, output);

    assert.equal(output.versions[0].quality, 30);
    assert.equal(output.versions[1].quality, 99);
  });

  it('returns convert command', function() {
    var cmd = resize.cmd(image, output);
    assert.equal(cmd, [
      // original image
      'convert ./assets/horizontal.jpg',
      '-strip',
      '-write mpr:./assets/horizontal.jpg +delete',

      // version[0]
      'mpr:./assets/horizontal.jpg',
      '-quality 80',
      '-resize "1920x1920"',
      '-write assets/horizontal-full.jpg +delete',

      // version[1]
      'mpr:./assets/horizontal.jpg',
      '-quality 80',
      '-crop "3936x2623+624+0"',
      '-resize "1200x1200"',
      'assets/horizontal-1200.jpg'
    ].join(' '));
  });
});

describe('resize.cmdVersion()', function() {
  it('returns convert command for version', function() {
    var image = {
      path: './a.jpg',
      width: 2000,
      height: 1000
    };

    var version = {
      path: 'a-b.jpg',
      maxWidth: 500,
      maxHeight: 500
    };

    var cmd = resize.cmdVersion(image, version);
    var out = 'mpr:./a.jpg -resize "500x500" -write a-b.jpg +delete';

    assert.equal(cmd, out);
  });

  it('sets quality if specified', function() {
    var image = {
      path: './a.jpg',
      width: 2000,
      height: 1000
    };

    var version = {
      path: 'a-b.jpg',
      quality: 50,
      maxWidth: 500,
      maxHeight: 500
    };

    var cmd = resize.cmdVersion(image, version);
    var out = 'mpr:./a.jpg -quality 50 -resize "500x500" -write a-b.jpg +delete';

    assert.equal(cmd, out);
  });
});

describe('resize()', function() {
  var output;

  beforeEach(function() {
    output = {
      versions: [{
        suffix: '-full',
        maxHeight: 1920,
        maxWidth: 1920
      },{
        suffix: '-1200',
        maxHeight: 1200,
        maxWidth: 1200,
        aspect: "3:2"
      },{
        suffix: '-800',
        maxHeight: 800,
        maxWidth: 800,
        aspect: "3:2"
      },{
        suffix: '-500',
        maxHeight: 500,
        maxWidth: 500,
        aspect: "3:2"
      },{
        suffix: '-260',
        maxHeight: 260,
        maxWidth: 260,
        aspect: "3:2"
      },{
        suffix: '-150',
        maxHeight: 150,
        maxWidth: 150,
        aspect: "3:2"
      },{
        suffix: '-square-200',
        maxHeight: 200,
        maxWidth: 200,
        aspect: "1:1"
      },{
        suffix: '-square-50',
        maxHeight: 50,
        maxWidth: 50,
        aspect: "1:1"
      }]
    };
  });

  it('resisizes horizontal image', function(done) {
    this.timeout(10000);

    var image = {
      path: './assets/horizontal.jpg',
      width: 5184,
      height: 2623
    };

    var paths = [
      'assets/horizontal-full.jpg',
      'assets/horizontal-1200.jpg',
      'assets/horizontal-800.jpg',
      'assets/horizontal-500.jpg',
      'assets/horizontal-260.jpg',
      'assets/horizontal-150.jpg',
      'assets/horizontal-square-200.jpg',
      'assets/horizontal-square-50.jpg'
    ];

    resize(image, output, function(err, versions) {
      assert.ifError(err);
      assert(versions instanceof Array);

      for(var i = 0; i < versions.length; i++) {
        assert.equal(versions[i].path, paths[i]);
      }

      done();
    });
  });

  it('resisizes vertical image', function(done) {
    this.timeout(10000);

    var image = {
      path: './assets/vertical.jpg',
      width: 1929,
      height: 3456
    };

    var paths = [
      'assets/vertical-full.jpg',
      'assets/vertical-1200.jpg',
      'assets/vertical-800.jpg',
      'assets/vertical-500.jpg',
      'assets/vertical-260.jpg',
      'assets/vertical-150.jpg',
      'assets/vertical-square-200.jpg',
      'assets/vertical-square-50.jpg'
    ];

    resize(image, output, function(err, versions) {
      assert.ifError(err);
      assert(versions instanceof Array);

      for(var i = 0; i < versions.length; i++) {
        assert.equal(versions[i].path, paths[i]);
      }

      done();
    });
  });

  it('resizes transparent image', function(done) {
    this.timeout(10000);

    var image = {
      path: './assets/transparent.png',
      width: 800,
      height: 600
    };

    for (var i = 0; i < output.versions.length; i++) {
      output.versions[i].flatten = true;
      output.versions[i].background = 'red';
      output.versions[i].format = 'jpg';
    }

    var paths = [
      'assets/transparent-full.jpg',
      'assets/transparent-1200.jpg',
      'assets/transparent-800.jpg',
      'assets/transparent-500.jpg',
      'assets/transparent-260.jpg',
      'assets/transparent-150.jpg',
      'assets/transparent-square-200.jpg',
      'assets/transparent-square-50.jpg'
    ];

    resize(image, output, function(err, versions) {
      assert.ifError(err);
      assert(versions instanceof Array);

      for(var i = 0; i < versions.length; i++) {
        assert.equal(versions[i].path, paths[i]);
      }

      done();
    });
  });
});
