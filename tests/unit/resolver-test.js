/* globals requirejs */

import Ember from 'ember';
import { module, test } from 'qunit';
import Resolver from 'ember-resolver/resolver';

let originalRegistryEntries, originalEmberDeprecate, originalEmberLoggerInfo, logCalls, resolver;

function setupResolver(options) {
  if (!options) {
    options = { namespace: { modulePrefix: 'appkit' } };
  }

  resolver = Resolver.create(options);
}

function resetRegistry() {
  requirejs.clear();
  Ember.merge(requirejs.entries, originalRegistryEntries);
}

module('ember-resolver/resolver', {
  beforeEach() {
    originalRegistryEntries = Ember.merge({}, requirejs.entries);
    originalEmberDeprecate = Ember.deprecate;
    originalEmberLoggerInfo = Ember.Logger.info;

    setupResolver();
  },

  afterEach() {
    resetRegistry();
    Ember.deprecate = originalEmberDeprecate;
    Ember.Logger.info = originalEmberLoggerInfo;
  }
});

test('does not require `namespace` to exist at `init` time', function(assert) {
  assert.expect(0);

  Resolver.create();
});

test("can lookup something", function(assert){
  assert.expect(2);

  define('appkit/adapters/post', [], function(){
    assert.ok(true, "adapter was invoked properly");

    return {};
  });

  var adapter = resolver.resolve('adapter:post');

  assert.ok(adapter, 'adapter was returned');
});

test("can lookup something in another namespace", function(assert){
  assert.expect(3);

  let expected = {};

  define('other/adapters/post', [], function(){
    assert.ok(true, "adapter was invoked properly");

    return {
      default: expected
    };
  });

  var adapter = resolver.resolve('other@adapter:post');

  assert.ok(adapter, 'adapter was returned');
  assert.equal(adapter, expected, 'default export was returned');
});

test("can lookup something with an @ sign", function(assert){
  assert.expect(3);

  let expected = {};
  define('appkit/helpers/@content-helper', [], function(){
    assert.ok(true, "helper was invoked properly");

    return { default: expected };
  });

  var helper = resolver.resolve('helper:@content-helper');

  assert.ok(helper, 'helper was returned');
  assert.equal(helper, expected, 'default export was returned');
});

test("can lookup something in another namespace with different syntax", function(assert){
  assert.expect(3);

  let expected = {};
  define('other/adapters/post', [], function(){
    assert.ok(true, "adapter was invoked properly");

    return { default: expected };
  });

  var adapter = resolver.resolve('adapter:other@post');

  assert.ok(adapter, 'adapter was returned');
  assert.equal(adapter, expected, 'default export was returned');
});

test("can lookup a view in another namespace", function(assert) {
  assert.expect(3);

  let expected = { isViewFactory: true };
  define('other/views/post', [], function(){
    assert.ok(true, "view was invoked properly");

    return { default: expected };
  });

  var view = resolver.resolve('other@view:post');

  assert.ok(view, 'view was returned');
  assert.equal(view, expected, 'default export was returned');
});

test("can lookup a view in another namespace with different syntax", function(assert) {
  assert.expect(3);

  let expected = { isViewFactory: true };
  define('other/views/post', [], function(){
    assert.ok(true, "view was invoked properly");

    return { default: expected };
  });

  var view = resolver.resolve('view:other@post');

  assert.ok(view, 'view was returned');
  assert.equal(view, expected, 'default export was returned');
});

test("can lookup a view", function(assert) {
  assert.expect(3);

  let expected = { isViewFactory: true };
  define('appkit/views/queue-list', [], function(){
    assert.ok(true, "view was invoked properly");

    return { default: expected };
  });

  var view = resolver.resolve('view:queue-list');

  assert.ok(view, 'view was returned');
  assert.equal(view, expected, 'default export was returned');
});

test("will return the raw value if no 'default' is available", function(assert) {
  define('appkit/fruits/orange', [], function(){
    return 'is awesome';
  });

  assert.equal(resolver.resolve('fruit:orange'), 'is awesome', 'adapter was returned');
});

test("will unwrap the 'default' export automatically", function(assert) {
  define('appkit/fruits/orange', [], function(){
    return { default: 'is awesome' };
  });

  assert.equal(resolver.resolve('fruit:orange'), 'is awesome', 'adapter was returned');
});

test("router:main is hard-coded to prefix/router.js", function(assert) {
  assert.expect(1);

  define('appkit/router', [], function(){
    assert.ok(true, 'router:main was looked up');
    return 'whatever';
  });

  resolver.resolve('router:main');
});

test("store:main is looked up as prefix/store", function(assert) {
  assert.expect(1);

  define('appkit/store', [], function(){
    assert.ok(true, 'store:main was looked up');
    return 'whatever';
  });

  resolver.resolve('store:main');
});

test("store:posts as prefix/stores/post", function(assert) {
  assert.expect(1);

  define('appkit/stores/post', [], function(){
    assert.ok(true, 'store:post was looked up');
    return 'whatever';
  });

  resolver.resolve('store:post');
});

test("will raise error if both dasherized and underscored modules exist", function(assert) {
  define('appkit/big-bands/steve-miller-band', [], function(){
    assert.ok(true, 'dasherized version looked up');
    return 'whatever';
  });

  define('appkit/big_bands/steve_miller_band', [], function(){
    assert.ok(false, 'underscored version looked up');
    return 'whatever';
  });

  try {
    resolver.resolve('big-band:steve-miller-band');
  } catch (e) {
    assert.equal(e.message, 'Ambiguous module names: `appkit/big-bands/steve-miller-band` and `appkit/big_bands/steve_miller_band`', "error with a descriptive value is thrown");
  }
});

test("will lookup an underscored version of the module name when the dasherized version is not found", function(assert) {
  assert.expect(1);

  define('appkit/big_bands/steve_miller_band', [], function(){
    assert.ok(true, 'underscored version looked up properly');
    return 'whatever';
  });

  resolver.resolve('big-band:steve-miller-band');
});

test("can lookup templates with mixed naming moduleName", function(assert) {
  assert.expect(2);

  Ember.deprecate = function(message, test) {
    if (!test) {
      assert.equal(message, 'Modules should not contain underscores. Attempted to lookup "appkit/bands/-steve-miller-band" which was not found. Please rename "appkit/bands/_steve-miller-band" to "appkit/bands/-steve-miller-band" instead.');
    }
  };

  define('appkit/bands/_steve-miller-band', [], function(){
    assert.ok(true, 'underscored version looked up properly');

    return 'whatever';
  });

  resolver.resolve('band:-steve-miller-band');
});

test("can lookup templates via Ember.TEMPLATES", function(assert) {
  Ember.TEMPLATES['application'] = function() {
    return '<h1>herp</h1>';
  };

  var template = resolver.resolve('template:application');
  assert.ok(template, 'template should resolve');
});

test('it provides eachForType which invokes the callback for each item found', function(assert) {

  function orange() { }
  define('appkit/fruits/orange', [], function() {
    return { default: orange };
  });

  function apple() { }
  define('appkit/fruits/apple', [], function() {
    return {default: apple };
  });

  function other() {}
  define('appkit/stuffs/other', [], function() {
    return { default: other };
  });

  var items = resolver.knownForType('fruit');

  assert.deepEqual(items, {
    'fruit:orange': true,
    'fruit:apple': true
  });
});

test('eachForType can find both pod and non-pod factories', function(assert) {
  function orange() { }
  define('appkit/fruits/orange', [], function() {
    return { default: orange };
  });

  function lemon() { }
  define('appkit/lemon/fruit', [], function() {
    return { default: lemon };
  });

  var items = resolver.knownForType('fruit');

  assert.deepEqual(items, {
    'fruit:orange': true,
    'fruit:lemon': true
  });
});

test('if shouldWrapInClassFactory returns true a wrapped object is returned', function(assert) {
  resolver.shouldWrapInClassFactory = function(defaultExport, parsedName) {
    assert.equal(defaultExport, 'foo');
    assert.equal(parsedName.fullName, 'string:foo');

    return true;
  };

  define('appkit/strings/foo', [], function() {
    return { default: 'foo' };
  });

  var value = resolver.resolve('string:foo');

  assert.equal(value.create(), 'foo');
});

module("Logging", {
  beforeEach: function() {
    originalEmberLoggerInfo = Ember.Logger.info;
    logCalls = [];
    Ember.Logger.info = function(arg) {
      logCalls.push(arg);
    };
    setupResolver();
  },

  afterEach: function() {
    Ember.Logger.info = originalEmberLoggerInfo;
  }
});

test("logs lookups when logging is enabled", function(assert) {
  define('appkit/fruits/orange', [], function(){
    return 'is logged';
  });

  Ember.ENV.LOG_MODULE_RESOLVER = true;

  resolver.resolve('fruit:orange');

  assert.ok(logCalls.length, "should log lookup");
});

test("doesn't log lookups if disabled", function(assert) {
  define('appkit/fruits/orange', [], function(){
    return 'is not logged';
  });

  Ember.ENV.LOG_MODULE_RESOLVER = false;

  resolver.resolve('fruit:orange');

  assert.equal(logCalls.length, 0, "should not log lookup");
});

module("custom prefixes by type", {
  beforeEach: setupResolver,
  afterEach: resetRegistry
});

test("will use the prefix specified for a given type if present", function(assert) {
  setupResolver({ namespace: {
    fruitPrefix: 'grovestand',
    modulePrefix: 'appkit'
  }});

  define('grovestand/fruits/orange', [], function(){
    assert.ok(true, 'custom prefix used');
    return 'whatever';
  });

  resolver.resolve('fruit:orange');
});

module("pods lookup structure", {
  beforeEach: function() {
    setupResolver();
  },

  afterEach: resetRegistry
});

test("will lookup modulePrefix/name/type before prefix/type/name", function(assert) {
  define('appkit/controllers/foo', [], function(){
    assert.ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  define('appkit/foo/controller', [], function(){
    assert.ok(true, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

test("will lookup names with slashes properly", function(assert) {
  define('appkit/controllers/foo/index', [], function(){
    assert.ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  define('appkit/foo/index/controller', [], function(){
    assert.ok(true, 'appkit/foo/index/controller was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo/index');
});

test("specifying a podModulePrefix overrides the general modulePrefix", function(assert) {
  setupResolver({
    namespace: {
      modulePrefix: 'appkit',
      podModulePrefix: 'appkit/pods'
    }
  });

  define('appkit/controllers/foo', [], function(){
    assert.ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  define('appkit/foo/controller', [], function(){
    assert.ok(false, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  define('appkit/pods/foo/controller', [], function(){
    assert.ok(true, 'appkit/pods/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

test("will not use custom type prefix when using POD format", function(assert) {
  resolver.namespace['controllerPrefix'] = 'foobar';

  define('foobar/controllers/foo', [], function(){
    assert.ok(false, 'foobar/controllers was used');
    return 'whatever';
  });

  define('foobar/foo/controller', [], function(){
    assert.ok(false, 'foobar/foo/controllers was used');
    return 'whatever';
  });

  define('appkit/foo/controller', [], function(){
    assert.ok(true, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

test("will lookup a components template without being rooted in `components/`", function(assert) {
  define('appkit/components/foo-bar/template', [], function(){
    assert.ok(false, 'appkit/components was used');
    return 'whatever';
  });

  define('appkit/foo-bar/template', [], function(){
    assert.ok(true, 'appkit/foo-bar/template was used');
    return 'whatever';
  });

  resolver.resolve('template:components/foo-bar');
});

test("will use pods format to lookup components in components/", function(assert) {
  assert.expect(3);

  let expectedComponent = { isComponentFactory: true };
  define('appkit/components/foo-bar/template', [], function(){
    assert.ok(true, 'appkit/components was used');
    return 'whatever';
  });

  define('appkit/components/foo-bar/component', [], function(){
    assert.ok(true, 'appkit/components was used');
    return { default: expectedComponent };
  });

  resolver.resolve('template:components/foo-bar');
  let component = resolver.resolve('component:foo-bar');

  assert.equal(component, expectedComponent, 'default export was returned');
});

test("will not lookup routes in components/", function(assert) {
  assert.expect(1);

  define('appkit/components/foo-bar/route', [], function(){
    assert.ok(false, 'appkit/components was used');
    return { isRouteFactory: true };
  });

  define('appkit/routes/foo-bar', [], function(){
    assert.ok(true, 'appkit/routes was used');
    return { isRouteFactory: true };
  });

  resolver.resolve('route:foo-bar');
});

test("will not lookup non component templates in components/", function(assert) {
  assert.expect(1);

  define('appkit/components/foo-bar/template', [], function(){
    assert.ok(false, 'appkit/components was used');
    return 'whatever';
  });

  define('appkit/templates/foo-bar', [], function(){
    assert.ok(true, 'appkit/templates was used');
    return 'whatever';
  });

  resolver.resolve('template:foo-bar');
});

module("custom pluralization", {
  afterEach: resetRegistry
});

test("will use the pluralization specified for a given type", function(assert) {
  assert.expect(1);

  setupResolver({
    namespace: {
      modulePrefix: 'appkit'
    },

    pluralizedTypes: {
      'sheep': 'sheep',
      'octipus': 'octipii'
    }
  });

  define('appkit/sheep/baaaaaa', [], function(){
    assert.ok(true, 'custom pluralization used');
    return 'whatever';
  });

  resolver.resolve('sheep:baaaaaa');
});

test("will pluralize 'config' as 'config' by default", function(assert) {
  assert.expect(1);

  setupResolver();

  define('appkit/config/environment', [], function(){
    assert.ok(true, 'config/environment is found');
    return 'whatever';
  });

  resolver.resolve('config:environment');
});

test("'config' can be overridden", function(assert) {
  assert.expect(1);

  setupResolver({
    namespace: {
      modulePrefix: 'appkit'
    },

    pluralizedTypes: {
      'config': 'super-duper-config'
    }
  });

  define('appkit/super-duper-config/environment', [], function(){
    assert.ok(true, 'super-duper-config/environment is found');
    return 'whatever';
  });

  resolver.resolve('config:environment');
});
