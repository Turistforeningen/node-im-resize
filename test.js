/*jshint laxbreak:true */

var assert = require('assert');
var crypto = require('crypto');
var fs = require('fs');
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
    var crop = resize.crop(image, '3:2');

    assert.equal(crop.geometry, '3936x2623+624+0');
    assert.equal(crop.width, '3936');
    assert.equal(crop.height, '2623');
  });

  it('returns crop geometry for vertical image', function() {
    var image = {height: 5184, width: 2623};
    var crop = resize.crop(image, '3:2!v');

    assert.equal(crop.geometry, '2623x3936+0+624');
    assert.equal(crop.width, '2623');
    assert.equal(crop.height, '3936');
  });

  it('returns no crop for image with correct aspectratio', function() {
    var image = {width: 2000, height: 1000};
    var crop = resize.crop(image, '2:1');

    assert.equal(crop.geometry, null);
    assert.equal(crop.width, image.width);
    assert.equal(crop.height, image.height);
  });

  it('returns no crop if no aspectratio is defined', function() {
    var image = {width: 2000, height: 1000};
    var crop = resize.crop(image);

    assert.equal(crop.geometry, null);
    assert.equal(crop.width, image.width);
    assert.equal(crop.height, image.height);
  });
});

describe('resize.resize()', function() {
  var crop = { width: 800, height: 533 };

  it('returns null for no maxWidth or maxHeight', function() {
    var version  = {};
    var geometry = resize.resize(crop, version);

    assert.equal(geometry, null);
  });

  it('returns geometry for only maxWidth', function() {
    var version  = { maxWidth: 500 };
    var geometry = resize.resize(crop, version);

    assert.equal(geometry, '500');
  });

  it('returns geometry for only maxHeight', function() {
    var version  = { maxHeight: 500 };
    var geometry = resize.resize(crop, version);

    assert.equal(geometry, 'x500');
  });

  it('returns geometry for maxWidth and maxHeight', function() {
    var version  = { maxWidth: 500, maxHeight: 500 };
    var geometry = resize.resize(crop, version);

    assert.equal(geometry, '500x500');
  });

  it('sets width and height on version object', function() {
    var version  = { maxWidth: 500, maxHeight: 500 };
    var geometry = resize.resize(crop, version);

    assert.equal(version.width, 500);
    assert.equal(version.height, 333);
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
      '-auto-orient',
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
  var image, version;

  beforeEach(function() {
    image = {
      path: './a.jpg',
      width: 2000,
      height: 1000
    };

    version = {
      path: 'a-b.jpg',
      maxWidth: 500,
      maxHeight: 500
    };
  });

  it('returns convert command for version', function() {
    var cmd = resize.cmdVersion(image, version);
    var out = 'mpr:./a.jpg -resize "500x500" -write a-b.jpg +delete';

    assert.equal(cmd, out);
  });

  it('returns convert command for last version', function() {
    var cmd = resize.cmdVersion(image, version, true);
    var out = 'mpr:./a.jpg -resize "500x500" a-b.jpg';

    assert.equal(cmd, out);
  });

  it('sets quality if specified', function() {
    version.quality = 50;

    var cmd = resize.cmdVersion(image, version);
    var out = 'mpr:./a.jpg -quality 50 -resize "500x500" -write a-b.jpg +delete';

    assert.equal(cmd, out);
  });

  it('sets crop if aspect ratio is defined', function() {
    version.aspect = '4:3';

    var cmd = resize.cmdVersion(image, version);
    var out = [
      'mpr:./a.jpg',
      '-crop "1334x1000+333+0"',
      '-resize "500x500"',
      '-write a-b.jpg',
      '+delete'
    ].join(' ');

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
        suffix: '-horizontal-500',
        maxHeight: 500,
        maxWidth: 500,
        aspect: "3:2!h",
      },{
        suffix: '-vertical-500',
        maxHeight: 500,
        maxWidth: 500,
        aspect: "3:2!v",
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
    this.timeout(5000);

    var image = {
      path: './assets/horizontal.jpg',
      width: 5184,
      height: 2623
    };

    var checksum = {
      'assets/horizontal-150.jpg': {
        sha1: 'ad5957669f0774cd66be76414dcbe6b0d789367d',
        width: 150,
        height: 100
      },
      'assets/horizontal-260.jpg': {
        sha1: '33437a2300f7d991c439d532075e211aad962a78',
        width: 260,
        height: 173
      },
      'assets/horizontal-500.jpg': {
        sha1: '58b09dc1f4ecf22427cc73ffd7b8ef2194fff4bb',
        width: 500,
        height: 333
      },
      'assets/horizontal-800.jpg': {
        sha1: '9ebf00a2d96361720dcbcb66af14689d3d51269f',
        width: 800,
        height: 533
      },
      'assets/horizontal-1200.jpg': {
        sha1: '54f1be17d4ffac0cb23802f1c04e783594662a8a',
        width: 1200,
        height: 800
      },
      'assets/horizontal-full.jpg': {
        sha1: '1a97483f4dfc21ea77217731a0f1908f8edeec22',
        width: 1920,
        height: 971
      },
      'assets/horizontal-horizontal-500.jpg': {
        sha1: '58b09dc1f4ecf22427cc73ffd7b8ef2194fff4bb',
        width: 500,
        height: 333
      },
      'assets/horizontal-square-50.jpg': {
        sha1: 'cc0291eb853ceba62b009626ae7a0e68562e93de',
        width: 50,
        height: 50
      },
      'assets/horizontal-square-200.jpg': {
        sha1: '576b72b83f486cfc684f459670e912310427a6a5',
        width: 200,
        height: 200
      },
      'assets/horizontal-vertical-500.jpg': {
        sha1: '6b5cda8f8b58f49c653a8dc48ae2976c7d079c3d',
        width: 334,
        height: 500
      },
    };

    resize(image, output, function(err, versions) {
      assert.ifError(err);
      assert(versions instanceof Array);

      for(var i = 0; i < versions.length; i++) {
        var file = fs.readFileSync(versions[i].path);
        var sha1 = crypto.createHash('sha1').update(file).digest('hex');

        assert.equal(sha1, checksum[versions[i].path].sha1);
        assert.equal(versions[i].width, checksum[versions[i].path].width);
        assert.equal(versions[i].height, checksum[versions[i].path].height);
      }

      done();
    });
  });

  it('resisizes vertical image', function(done) {
    this.timeout(5000);

    var image = {
      path: './assets/vertical.jpg',
      width: 2448,
      height:3264
    };

    var checksum = {
      'assets/vertical-150.jpg': {
        sha1: '0224e40c72f3dac7361a5eab2d9b08616ea42acd',
        width: 100,
        height: 150
      },
      'assets/vertical-260.jpg': {
        sha1: 'e8603d6d2654ed589f45d7c485eafdd91bcc8063',
        width: 173,
        height: 260
      },
      'assets/vertical-500.jpg': {
        sha1:  '5335938e3c0599144a514a0014cdf882fc5fe975',
        width: 333,
        height: 500
      },
      'assets/vertical-800.jpg': {
        sha1:  '9d5c719cce45f66295e11c4853c100fba6e59b49',
        width: 533,
        height: 800
      },
      'assets/vertical-1200.jpg': {
        sha1: '0a2b3e842d15aab4231e4ff41f46d6b8a45356da',
        width: 800,
        height: 1200
      },
      'assets/vertical-full.jpg': {
        sha1:  '654e1bce7a1f2faebd7359009c1f4614823d0148',
        width: 1440,
        height: 1920
      },
      'assets/vertical-horizontal-500.jpg': {
        sha1: '587da3f047218e4dcef5f5ea75525c485e74f4bc',
        width: 500,
        height: 333
      },
      'assets/vertical-square-50.jpg': {
        sha1:  '748d2dad7f8135167db297b4f9dec480e1cd4a1a',
        width: 50,
        height: 50
      },
      'assets/vertical-square-200.jpg': {
        sha1:  '00d8cd18a861787a02f025b81bf9a7a8ad80e377',
        width: 200,
        height: 200
      },
      'assets/vertical-vertical-500.jpg': {
        sha1:  '5335938e3c0599144a514a0014cdf882fc5fe975',
        width: 333,
        height: 500
      }
    };

    resize(image, output, function(err, versions) {
      assert.ifError(err);

      assert(versions instanceof Array);
      assert.equal(versions.length, output.versions.length);

      for(var i = 0; i < versions.length; i++) {
        var file = fs.readFileSync(versions[i].path);
        var sha1 = crypto.createHash('sha1').update(file).digest('hex');

        assert.equal(sha1, checksum[versions[i].path].sha1);
        assert.equal(versions[i].width, checksum[versions[i].path].width);
        assert.equal(versions[i].height, checksum[versions[i].path].height);
      }

      done();
    });
  });

  it('resizes transparent image', function(done) {
    this.timeout(5000);

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

    var checksum = {
      'assets/transparent-150.jpg': {
        sha1: 'f46d2e15c618b65d9e082f605e894d5ebd6a5450',
        width: 150,
        height: 100
      },
      'assets/transparent-260.jpg': {
        sha1: '1ccf58141dfa60fe2cc74f024a9df82172e235d4',
        width: 260,
        height: 174
      },
      'assets/transparent-500.jpg': {
        sha1: 'c0705376d473724384e6ed30a1305683023780e9',
        width: 500,
        height: 334
      },
      'assets/transparent-800.jpg': {
        sha1: '017ec8afb9a81eae00132105da9cd6ea4083011c',
        width: 800,
        height: 534
      },
      'assets/transparent-1200.jpg': {
        sha1: '35069de49846815381830b4c46ab90f75eba43aa',
        width: 1200,
        height: 801
      },
      'assets/transparent-full.jpg': {
        sha1: '78e3647bc9f86f3e0a8a0a25dcc60fba519c29b9',
        width: 1920,
        height: 1440
      },
      'assets/transparent-horizontal-500.jpg': {
        sha1: 'c0705376d473724384e6ed30a1305683023780e9',
        width: 500,
        height: 334
      },
      'assets/transparent-square-50.jpg': {
        sha1: 'ea8a03a6f9acfd1c5170c4b5d382c84aa3b304dc',
        width: 50,
        height: 50
      },
      'assets/transparent-square-200.jpg': {
        sha1: '012230141cb127947cfe958c452560b7a50d2425',
        width: 200,
        height: 200
      },
      'assets/transparent-vertical-500.jpg': {
        sha1: '384f876de67f866daca7d675a7b2a4f256c2767e',
        width: 333,
        height: 500
      }
    };

    resize(image, output, function(err, versions) {
      assert.ifError(err);

      assert(versions instanceof Array);
      assert.equal(versions.length, output.versions.length);

      for(var i = 0; i < versions.length; i++) {
        var file = fs.readFileSync(versions[i].path);
        var sha1 = crypto.createHash('sha1').update(file).digest('hex');

        assert.equal(sha1, checksum[versions[i].path].sha1);
        assert.equal(versions[i].width, checksum[versions[i].path].width);
        assert.equal(versions[i].height, checksum[versions[i].path].height);
      }

      done();
    });
  });

  it('scales up small image', function(done) {
    this.timeout(5000);

    var image = {
      path: './assets/small.jpg',
      width: 454,
      height: 302
    };

    var checksum = {
      'assets/small-150.jpg': {
        sha1: 'f59cd76f9ba1d3a947a3cbb6682014702f50d51d',
        width: 150,
        height: 100
      },
      'assets/small-260.jpg': {
        sha1: '82d417cac5df64e62a380e9d6067d5230f35c5f3',
        width: 260,
        height: 173
      },
      'assets/small-500.jpg': {
        sha1: '02a4824a773aa174af4827ea41f89024073ff915',
        width: 500,
        height: 333
      },
      'assets/small-800.jpg': {
        sha1: '2ed95b3153288fb3d81b3adffa69063efd48e9e6',
        width: 800,
        height: 532
      },
      'assets/small-1200.jpg': {
        sha1: '718c033c6e2d3a001e741ac144a464f4b32b4524',
        width: 1200,
        height: 798
      },
      'assets/small-full.jpg': {
        sha1: '01cbbab9aef8891a56f2cf3a021e4e59b0b6f4de',
        width: 1920,
        height: 1277
      },
      'assets/small-horizontal-500.jpg': {
        sha1: '02a4824a773aa174af4827ea41f89024073ff915',
        width: 500,
        height: 333
      },
      'assets/small-square-50.jpg': {
        sha1: 'b583b4f4ae755b3ae54fa669c04d9cefc751122a',
        width: 50,
        height: 50
      },
      'assets/small-square-200.jpg': {
        sha1: '37aba56af39aebfa23650441f5068aa03e2f1480',
        width: 200,
        height: 200
      },
      'assets/small-vertical-500.jpg': {
        sha1: '1660d8ea52a994721641322716b1cc194c04d97e',
        width: 334,
        height: 500
      }
    };

    resize(image, output, function(err, versions) {
      assert.ifError(err);

      assert(versions instanceof Array);
      assert.equal(versions.length, output.versions.length);

      for(var i = 0; i < versions.length; i++) {
        var file = fs.readFileSync(versions[i].path);
        var sha1 = crypto.createHash('sha1').update(file).digest('hex');

        assert.equal(sha1, checksum[versions[i].path].sha1);
        assert.equal(versions[i].width, checksum[versions[i].path].width);
        assert.equal(versions[i].height, checksum[versions[i].path].height);
      }

      done();
    });
  });

  it('auto-rotates rotated image', function(done) {
    this.timeout(5000);

    var image = {
      path: './assets/autorotate.jpg',
      width: 3264,
      height: 2448
    };

    var checksum = {
      'assets/autorotate-150.jpg': {
        sha1: 'd837d5fb4239f9fe1e3566df34906e3f8d654275',
        width: 150,
        height: 100
      },
      'assets/autorotate-260.jpg': {
        sha1: 'a9b811a19fb078264e655c0c3c01acffda8d192e',
        width: 260,
        height: 173
      },
      'assets/autorotate-500.jpg': {
        sha1: 'c5437d9b2dbbf791931ca9089020c78ac8fd02a3',
        width: 500,
        height: 333
      },
      'assets/autorotate-800.jpg': {
        sha1: '081df1cc1a3d7d76a0762f0d586dbecff221a25c',
        width: 800,
        height: 533
      },
      'assets/autorotate-1200.jpg': {
        sha1: 'e8f5b75aa6c9859426c1d652d57a053444f897ff',
        width: 1200,
        height: 800
      },
      'assets/autorotate-full.jpg': {
        sha1: 'efe10ac17cae71bd28c316728d6d29eeacc11fd8',
        width: 1920,
        height: 1440
      },
      'assets/autorotate-horizontal-500.jpg': {
        sha1: 'c5437d9b2dbbf791931ca9089020c78ac8fd02a3',
        width: 500,
        height: 333
      },
      'assets/autorotate-square-50.jpg': {
        sha1: 'f716e975f6269c3b9649a04d4144c5481265169c',
        width: 50,
        height: 50
      },
      'assets/autorotate-square-200.jpg': {
        sha1: '24efb279a78b0c33a8715215d6f976c1f086573a',
        width: 200,
        height: 200
      },
      'assets/autorotate-vertical-500.jpg': {
        sha1: '11935afdde5f752d8d3e08242d9187392ba33aa5',
        width: 333,
        height: 500
      }
    };

    resize(image, output, function(err, versions) {
      assert.ifError(err);

      assert(versions instanceof Array);
      assert.equal(versions.length, output.versions.length);

      for(var i = 0; i < versions.length; i++) {
        var file = fs.readFileSync(versions[i].path);
        var sha1 = crypto.createHash('sha1').update(file).digest('hex');

        assert.equal(sha1, checksum[versions[i].path].sha1);
        assert.equal(versions[i].width, checksum[versions[i].path].width);
        assert.equal(versions[i].height, checksum[versions[i].path].height);
      }

      done();
    });
  });
});
