(function() {
/*globals define registry requirejs */

var Resolver, resolver;

function lookupResolver() {
  return requirejs._eak_seen['resolver'];
}

function resetRegistry() {
  var keeper = lookupResolver();

  requirejs.clear();
  define('resolver', keeper['deps'], keeper['callback']);
}

function setupResolver(options) {
  if (!options) {
    options = { namespace: { modulePrefix: 'appkit' } };
  }

  Resolver = require('resolver')['default'];
  resolver = Resolver.create(options);
}

module("Resolver Tests",{
  setup: function(){
    setupResolver();
  },

  teardown: resetRegistry
});

test("can access Resolver", function(){
  ok(resolver);
});

test("can lookup something", function(){
  expect(2);

  define('appkit/adapters/post', [], function(){
    ok(true, "adapter was invoked properly");

    return Ember.K;
  });

  var adapter = resolver.resolve('adapter:post');

  ok(adapter, 'adapter was returned');

  adapter();
});

test("will return the raw value if no 'default' is available", function() {
  define('appkit/fruits/orange', [], function(){
    return 'is awesome';
  });

  equal(resolver.resolve('fruit:orange'), 'is awesome', 'adapter was returned');
});

test("will unwrap the 'default' export automatically", function(){
  define('appkit/fruits/orange', [], function(){
    return {default: 'is awesome'};
  });

  equal(resolver.resolve('fruit:orange'), 'is awesome', 'adapter was returned');
});

test("router:main is hard-coded to prefix/router.js", function() {
  expect(1);

  define('appkit/router', [], function(){
    ok(true, 'router:main was looked up');
    return 'whatever';
  });

  resolver.resolve('router:main');
});

test("store:main is looked up as prefix/store", function() {
  expect(1);

  define('appkit/store', [], function(){
    ok(true, 'store:main was looked up');
    return 'whatever';
  });

  resolver.resolve('store:main');
});

test("store:posts as prefix/stores/post", function() {
  expect(1);

  define('appkit/stores/post', [], function(){
    ok(true, 'store:post was looked up');
    return 'whatever';
  });

  resolver.resolve('store:post');
});

test("will raise error if both dasherized and underscored modules exist", function() {
  define('appkit/big-bands/steve-miller-band', [], function(){
    ok(true, 'dasherized version looked up');
    return 'whatever';
  });

  define('appkit/big_bands/steve_miller_band', [], function(){
    ok(false, 'underscored version looked up');
    return 'whatever';
  });

  try {
    resolver.resolve('big-band:steve-miller-band');
  } catch (e) {
    equal(e.message, 'Ambiguous module names: `appkit/big-bands/steve-miller-band` and `appkit/big_bands/steve_miller_band`', "error with a descriptive value is thrown");
  }
});

test("will raise error if camelcased modules exist", function() {
  expect(1);
  define('appkit/controllers/postComment', [], function(){
    ok(false, 'should not lookup camelcased module');
    return 'whatever';
  });

  expectAssertion(function(){
    resolver.normalize('controller:postComment');
  }, 'Nested controllers need be referenced as [post/comment], instead of [postComment]. Refer documentation: http://iamstef.net/ember-app-kit/guides/naming-conventions.html');
});

test("will lookup an underscored version of the module name when the dasherized version is not found", function() {
  expect(1);

  define('appkit/big_bands/steve_miller_band', [], function(){
    ok(true, 'underscored version looked up properly');
    return 'whatever';
  });

  resolver.resolve('big-band:steve-miller-band');
});

test("can lookup templates with mixed naming moduleName", function(){
  expectDeprecation('Modules should not contain underscores. Attempted to lookup "appkit/bands/-steve-miller-band" which was not found. Please rename "appkit/bands/_steve-miller-band" to "appkit/bands/-steve-miller-band" instead.');

  expect(2);

  define('appkit/bands/_steve-miller-band', [], function(){
    ok(true, 'underscored version looked up properly');
    return 'whatever';
  });

  resolver.resolve('band:-steve-miller-band');
});

module("custom prefixes by type", {
  teardown: resetRegistry
});

test("will use the prefix specified for a given type if present", function() {
  setupResolver({ namespace: {
    fruitPrefix: 'grovestand',
    modulePrefix: 'appkit'
  }});

  define('grovestand/fruits/orange', [], function(){
    ok(true, 'custom prefix used');
    return 'whatever';
  });

  resolver.resolve('fruit:orange');
});

module("pods lookup structure", {
  setup: function() {
    setupResolver();
  },

  teardown: resetRegistry
});

test("will lookup modulePrefix/name/type before prefix/type/name", function() {
  define('appkit/controllers/foo', [], function(){
    ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  define('appkit/foo/controller', [], function(){
    ok(true, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

test("will lookup names with slashes properly", function() {
  define('appkit/controllers/foo/index', [], function(){
    ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  define('appkit/foo/index/controller', [], function(){
    ok(true, 'appkit/foo/index/controller was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo/index');
});

test("specifying a podModulePrefix overrides the general modulePrefix", function() {
  setupResolver({
    namespace: {
      modulePrefix: 'appkit',
      podModulePrefix: 'appkit/pods'
    }
  });

  define('appkit/controllers/foo', [], function(){
    ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  define('appkit/foo/controller', [], function(){
    ok(false, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  define('appkit/pods/foo/controller', [], function(){
    ok(true, 'appkit/pods/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

test("will not use custom type prefix when using POD format", function() {
  resolver.namespace['controllerPrefix'] = 'foobar';

  define('foobar/controllers/foo', [], function(){
    ok(false, 'foobar/controllers was used');
    return 'whatever';
  });

  define('foobar/foo/controller', [], function(){
    ok(false, 'foobar/foo/controllers was used');
    return 'whatever';
  });

  define('appkit/foo/controller', [], function(){
    ok(true, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

})();

