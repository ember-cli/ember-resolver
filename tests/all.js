'use strict';

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
  teardown: function() {
    requirejs.clear();
  }
});

test('has api', function() {
  equal(typeof require, 'function');
  equal(typeof define, 'function');
  equal(define.amd, undefined);
  ok(define.petal);
  equal(typeof requirejs, 'function');
  equal(typeof requireModule, 'function');
});

test('simple define/require', function() {
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


test('define without deps', function() {
  var fooCalled = 0;

  define('foo', function() {
    fooCalled++;
  });

  var foo = require('foo');
  equal(foo, undefined);
  equal(fooCalled, 1);
  deepEqual(keys(requirejs.entries), ['foo']);
});


test('multiple define/require', function() {
  define('foo', [], function() {

  });

  deepEqual(keys(requirejs.entries), ['foo']);

  define('bar', [], function() {

  });

  deepEqual(keys(requirejs.entries), ['foo', 'bar']);
});


test('simple import/export', function() {
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


test('simple import/export with `exports`', function() {
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

test('relative import/export', function() {
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

test('deep nested relative import/export', function() {
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

test('incorrect lookup paths should fail', function() {

  define('foo/isolated-container', [], function() {
    return 'container';
  });


  define('foo', ['./isolated-container'], function(container) {
    return {
      container: container
    };
  });

  throws(function() {
    return require('foo');
  }, 'Could not find module isolated-container');

});

test('top-level relative import/export', function() {
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

test('runtime cycles', function() {
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
  define('a/foo', ['require', 'exports', 'module'], function(require, exports, module) {
    module.exports = {
      bar: require('./bar').name
    };
  });

  define('a/bar', ['require', 'exports', 'module'], function(require, exports, module) {
    exports.name = 'bar';
  });

  var foo = require('a/foo');

  equal(foo.bar, 'bar');
});

test('pass default deps if arguments are expected and deps not passed', function() {
  define('foo', function(require, exports, module) {
    equal(arguments.length, 3);
  });

  require('foo');
});

test('if factory returns a value it is used as export', function() {
  define('foo', ['require', 'exports', 'module'], function(require, exports, module) {
    return {
      bar: 'bar'
    };
  });

  var foo = require('foo');

  equal(foo.bar, 'bar');
});

test("if a module has no default property assume the return is the default", function() {
  define('foo', [], function() {
    return {
      bar: 'bar'
    };
  });

  var foo = require('foo')['default'];

  equal(foo.bar, 'bar');
});


test("if a CJS style module has no default export assume module.exports is the default", function() {
  define('Foo', ['require', 'exports', 'module'], function(require, exports, module) {
    module.exports = function Foo() {
      this.bar = 'bar';
    };
  });

  var Foo = require('Foo')['default'];
  var foo = new Foo();

  equal(foo.bar, 'bar');
});


test("if a module has no default property assume its export is default (function)", function() {
  var theFunction = function theFunction() {};
  define('foo', ['require', 'exports', 'module'], function(require, exports, module) {
    return theFunction;
  });

  equal(require('foo')['default'], theFunction);
  equal(require('foo'), theFunction);
});


test("has good error message for missing module", function() {
  var theFunction = function theFunction() {};
  define('foo', ['apple'], function(require, exports, module) {
    return theFunction;
  });

  throws(function() {
    require('foo');
  }, /Could not find module `apple` imported from `foo`/);
});

test("provides good error message when an un-named AMD module is provided", function() {
  throws(function() {
    define(function() {

    });
  }, new Error('an unsupported module was defined, expected `define(name, deps, module)` instead got: `1` arguments to define`'));
});


test('throws when accessing parent module of root', function() {
  expect(2);

  define('foo', ['../a'], function() {});

  throws(function() {
    require('foo');
  }, /Cannot access parent module of root/);

  define('bar/baz', ['../../a'], function() {});

  throws(function() {
    require('bar/baz');
  }, /Cannot access parent module of root/);
});

test("relative CJS esq require", function() {
  define('foo/a', ['require'], function(require) {
    return require('./b');
  });


  define('foo/b', ['require'], function(require) {
    return require('./c');
  });

  define('foo/c', ['require'], function(require) {
    return 'c-content';
  });

  equal(require('foo/a'), 'c-content');
});


test("relative CJS esq require (with exports and module');", function() {
  define('foo/a', ['module', 'exports', 'require'], function(module, exports, require) {
    module.exports = require('./b');
  });

  define('foo/b', ['module', 'exports', 'require'], function(module, exports, require) {
    module.exports = require('./c');
  });

  define('foo/c', ['module', 'exports', 'require'], function(module, exports, require) {
    module.exports = 'c-content';
  });

  equal(require('foo/a'), 'c-content');
});

test('foo foo/index are the same thing', function() {
  define('foo/index', [] , function() {
    return { 'default': 'hi' };
  });

  define('foo', [ ], define.alias('foo/index'));

  define('bar', ['foo', 'foo/index'] , function(foo, fooIndex) {
    deepEqual(foo, fooIndex);
  });

  deepEqual(require('foo'), require('foo/index'));
});

test('unsee', function() {
  var counter = 0;
  define('foo', [] , function() {
    counter++;
    return { 'default': 'hi' };
  });

  equal(counter, 0);
  require('foo');
  equal(counter, 1);
  require('foo');
  equal(counter, 1);
  require.unsee('foo');
  equal(counter, 1);
  require('foo');
  equal(counter, 2);
  require('foo');
  equal(counter, 2);
});

test('/index fallback no ambiguity', function() {
  define('foo/index', [], function() {
    return 'I AM foo/index';
  });

  define('foo', define.alias('foo/index'));

  define('bar', ['foo'], function(foo) {
    return 'I AM bar with: ' + foo;
  });

  equal(require('foo'), 'I AM foo/index');
  equal(require('foo/index'), 'I AM foo/index');
  equal(require('bar'), 'I AM bar with: I AM foo/index');
});

test('/index fallback with ambiguity (alias after)', function() {
  define('foo', [], function() {
    return 'I AM foo';
  });

  define('foo/index', [], function() {
    return 'I AM foo/index';
  });

  define('foo', define.alias('foo/index'));

  define('bar', ['foo'], function(foo) {
    return 'I AM bar with: ' + foo;
  });

  equal(require('foo'), 'I AM foo/index');
  equal(require('foo/index'), 'I AM foo/index');
  equal(require('bar'), 'I AM bar with: I AM foo/index');
});

test('alias entries share same module instance', function() {
  var count = 0;
  define('foo', define.alias('foo/index'));

  define('foo/index', [], function() {
    count++;
  });

  equal(count, 0);
  require('foo');
  equal(count, 1);

  require('foo/index');
  equal(count, 1, 'second require should use existing instance');
});

test('/index fallback + unsee', function() {
  var count = 0;

  define('foo/index', [], function() {
    count++;
  });

  define('foo', define.alias('foo/index'));

  require('foo/index');
  equal(count, 1);

  require('foo/index');
  equal(count, 1);

  require.unsee('foo/index');
  require('foo/index');

  equal(count, 2);

  require.unsee('foo');
  require('foo');

  equal(count, 3);
});
