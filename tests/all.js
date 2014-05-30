var keys;

if (Object.keys) {
  keys = Object.keys;
} else {
  keys = function(obj) {
    var result = [];
    for (var key  in obj) {
      result.push(key);
    }
    return result;
  };
}

module('loader.js api', {
  teardown: function(){
    requirejs.clear();
  }
});

test('has api', function(){
  equal(typeof require, 'function');
  equal(typeof define, 'function');
  equal(typeof requirejs, 'function');
  equal(typeof requireModule, 'function');
});

test('simple define/require', function(){
  var fooCalled = 0;

  define('foo', [], function() {
    fooCalled++;
  });

  var foo = require('foo');
  equal(foo, undefined);
  equal(fooCalled, 1);
  deepEqual(keys(requirejs.entries), ['foo']);

  var fooAgain = require('foo');
  equal(fooAgain, undefined);
  equal(fooCalled, 1);

  deepEqual(keys(requirejs.entries), ['foo']);
});


test('multiple define/require', function(){
  define('foo', [], function() {

  });

  deepEqual(keys(requirejs.entries), ['foo']);

  define('bar', [], function() {

  });

  deepEqual(keys(requirejs.entries), ['foo', 'bar']);
});


test('simple import/export', function(){
  expect(2);
  define('foo', ['bar'], function(bar) {
    equal(bar.baz, 'baz');

    return bar.baz;
  });

  define('bar', [], function() {
    return {
      baz: 'baz'
    };
  });

  equal(require('foo'), 'baz');
});


test('simple import/export with `exports`', function(){
  expect(2);
  define('foo', ['bar', 'exports'], function(bar, __exports__) {
    equal(bar.baz, 'baz');

    __exports__.baz = bar.baz;
  });

  define('bar', ['exports'], function(__exports__) {
    __exports__.baz = 'baz';
  });

  equal(require('foo').baz, 'baz');
});

test('relative import/export', function(){
  expect(2);
  define('foo/a', ['./b'], function(bar) {
    equal(bar.baz, 'baz');

    return bar.baz;
  });

  define('foo/b', [], function() {
    return {
      baz: 'baz'
    };
  });

  equal(require('foo/a'), 'baz');
});

test('deep nested relative import/export', function(){
  expect(2);

  define('foo/a/b/c', ['../../b/b/c'], function(bar) {
    equal(bar.baz, 'baz');

    return bar.baz;
  });

  define('foo/b/b/c', [], function() {
    return {
      baz: 'baz'
    };
  });

  equal(require('foo/a/b/c'), 'baz');
});

test('top-level relative import/export', function(){
  expect(2);

  define('foo', ['./bar'], function(bar) {
    equal(bar.baz, 'baz');

    return bar.baz;
  });

  define('bar', [], function() {
    return {
      baz: 'baz'
    };
  });

  equal(require('foo'), 'baz');
});

test('runtime cycles', function(){
  define('foo', ['bar', 'exports'], function(bar, __exports__) {
    __exports__.quz = function() {
      return bar.baz;
    };
  });

  define('bar', ['foo', 'exports'], function(foo, __exports__) {
    __exports__.baz = function() {
      return foo.quz;
    };
  });

  var foo = require('foo');
  var bar = require('bar');

  ok(foo.quz());
  ok(bar.baz());

  equal(foo.quz(), bar.baz, 'cycle foo depends on bar');
  equal(bar.baz(), foo.quz, 'cycle bar depends on foo');
});

test('basic CJS mode', function() {
  define('foo', ['require', 'exports', 'module'], function(require, exports, module) {
    module.exports = {
      bar: require('bar').name
    };
  });

  define('bar', ['require', 'exports', 'module'], function(require, exports, module) {
    exports.name = 'bar';
  });

  var foo = require('foo');

  equal(foo.bar, 'bar');
});
