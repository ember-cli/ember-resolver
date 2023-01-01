/* eslint-disable no-console */

import Ember from 'ember';
import { module, test } from 'qunit';
import Resolver, { ModuleRegistry } from 'ember-resolver/resolvers/classic';

let originalConsoleInfo, logCalls, resolver, loader;

function setupResolver(options = {}) {
  if (!options.namespace) {
    options.namespace = { modulePrefix: 'appkit' };
  }
  loader = {
    entries: Object.create(null),
    define(id, deps, callback) {
      if (deps.length > 0) {
        throw new Error('Test Module loader does not support dependencies');
      }
      this.entries[id] = callback;
    },
  };
  options._moduleRegistry = new ModuleRegistry(loader.entries);
  options._moduleRegistry.get = function (moduleName) {
    return loader.entries[moduleName]();
  };

  resolver = Resolver.create(options);
}

module('ember-resolver/resolvers/classic', {
  beforeEach() {
    setupResolver();
  },

  afterEach() {
    if (originalConsoleInfo) {
      console.info = originalConsoleInfo;
    }
  },
});

// ember @ 3.3 breaks this: https://github.com/emberjs/ember.js/commit/b8613c20289cc8a730e181c4c51ecfc4b6836052#r29790209
// ember @ 3.4.0-beta.1 restores this: https://github.com/emberjs/ember.js/commit/ddd8d9b9d9f6d315185a34802618a666bb3aeaac
// test('does not require `namespace` to exist at `init` time', function(assert) {
//   assert.expect(0);

//   Resolver.create({ namespace: '' });
// });

test('can lookup something', function (assert) {
  assert.expect(2);

  loader.define('appkit/adapters/post', [], function () {
    assert.ok(true, 'adapter was invoked properly');

    return {};
  });

  var adapter = resolver.resolve('adapter:post');

  assert.ok(adapter, 'adapter was returned');
});

test('can lookup something in another namespace', function (assert) {
  assert.expect(3);

  let expected = {};

  loader.define('other/adapters/post', [], function () {
    assert.ok(true, 'adapter was invoked properly');

    return {
      default: expected,
    };
  });

  var adapter = resolver.resolve('other@adapter:post');

  assert.ok(adapter, 'adapter was returned');
  assert.equal(adapter, expected, 'default export was returned');
});

test('can lookup something in another namespace with an @ scope', function (assert) {
  assert.expect(3);

  let expected = {};

  loader.define('@scope/other/adapters/post', [], function () {
    assert.ok(true, 'adapter was invoked properly');

    return {
      default: expected,
    };
  });

  var adapter = resolver.resolve('@scope/other@adapter:post');

  assert.ok(adapter, 'adapter was returned');
  assert.equal(adapter, expected, 'default export was returned');
});

test('can lookup something with an @ sign', function (assert) {
  assert.expect(3);

  let expected = {};
  loader.define('appkit/helpers/@content-helper', [], function () {
    assert.ok(true, 'helper was invoked properly');

    return { default: expected };
  });

  var helper = resolver.resolve('helper:@content-helper');

  assert.ok(helper, 'helper was returned');
  assert.equal(helper, expected, 'default export was returned');
});

test('can lookup something in another namespace with different syntax', function (assert) {
  assert.expect(3);

  let expected = {};
  loader.define('other/adapters/post', [], function () {
    assert.ok(true, 'adapter was invoked properly');

    return { default: expected };
  });

  var adapter = resolver.resolve('adapter:other@post');

  assert.ok(adapter, 'adapter was returned');
  assert.equal(adapter, expected, 'default export was returned');
});

test('can lookup something in another namespace with an @ scope with different syntax', function (assert) {
  assert.expect(3);

  let expected = {};
  loader.define('@scope/other/adapters/post', [], function () {
    assert.ok(true, 'adapter was invoked properly');

    return { default: expected };
  });

  var adapter = resolver.resolve('adapter:@scope/other@post');

  assert.ok(adapter, 'adapter was returned');
  assert.equal(adapter, expected, 'default export was returned');
});

test('can lookup a view in another namespace', function (assert) {
  assert.expect(3);

  let expected = { isViewFactory: true };
  loader.define('other/views/post', [], function () {
    assert.ok(true, 'view was invoked properly');

    return { default: expected };
  });

  var view = resolver.resolve('other@view:post');

  assert.ok(view, 'view was returned');
  assert.equal(view, expected, 'default export was returned');
});

test('can lookup a view in another namespace with an @ scope', function (assert) {
  assert.expect(3);

  let expected = { isViewFactory: true };
  loader.define('@scope/other/views/post', [], function () {
    assert.ok(true, 'view was invoked properly');

    return { default: expected };
  });

  var view = resolver.resolve('@scope/other@view:post');

  assert.ok(view, 'view was returned');
  assert.equal(view, expected, 'default export was returned');
});

test('can lookup a view in another namespace with different syntax', function (assert) {
  assert.expect(3);

  let expected = { isViewFactory: true };
  loader.define('other/views/post', [], function () {
    assert.ok(true, 'view was invoked properly');

    return { default: expected };
  });

  var view = resolver.resolve('view:other@post');

  assert.ok(view, 'view was returned');
  assert.equal(view, expected, 'default export was returned');
});

test('can lookup a view in another namespace with an @ scope with different syntax', function (assert) {
  assert.expect(3);

  let expected = { isViewFactory: true };
  loader.define('@scope/other/views/post', [], function () {
    assert.ok(true, 'view was invoked properly');

    return { default: expected };
  });

  var view = resolver.resolve('view:@scope/other@post');

  assert.ok(view, 'view was returned');
  assert.equal(view, expected, 'default export was returned');
});

test('can lookup a component template in another namespace with different syntax', function (assert) {
  assert.expect(2);

  let expected = { isTemplate: true };
  loader.define('other/templates/components/foo-bar', [], function () {
    assert.ok(true, 'template was looked up properly');

    return { default: expected };
  });

  var template = resolver.resolve('template:components/other@foo-bar');

  assert.equal(template, expected, 'default export was returned');
});

test('can lookup a component template in another namespace with an @ scope with different syntax', function (assert) {
  assert.expect(2);

  let expected = { isTemplate: true };
  loader.define('@scope/other/templates/components/foo-bar', [], function () {
    assert.ok(true, 'template was looked up properly');

    return { default: expected };
  });

  var template = resolver.resolve('template:components/@scope/other@foo-bar');

  assert.equal(template, expected, 'default export was returned');
});

test('can lookup a view', function (assert) {
  assert.expect(3);

  let expected = { isViewFactory: true };
  loader.define('appkit/views/queue-list', [], function () {
    assert.ok(true, 'view was invoked properly');

    return { default: expected };
  });

  var view = resolver.resolve('view:queue-list');

  assert.ok(view, 'view was returned');
  assert.equal(view, expected, 'default export was returned');
});

test('can lookup a helper', function (assert) {
  assert.expect(3);

  let expected = { isHelperInstance: true };
  loader.define('appkit/helpers/reverse-list', [], function () {
    assert.ok(true, 'helper was invoked properly');

    return { default: expected };
  });

  var helper = resolver.resolve('helper:reverse-list');

  assert.ok(helper, 'helper was returned');
  assert.equal(helper, expected, 'default export was returned');
});

test('can lookup an engine', function (assert) {
  assert.expect(3);

  let expected = {};
  loader.define('appkit/engine', [], function () {
    assert.ok(true, 'engine was invoked properly');

    return { default: expected };
  });

  let engine = resolver.resolve('engine:appkit');

  assert.ok(engine, 'engine was returned');
  assert.equal(engine, expected, 'default export was returned');
});

test('can lookup an engine from a scoped package', function (assert) {
  assert.expect(3);

  let expected = {};
  loader.define('@some-scope/some-module/engine', [], function () {
    assert.ok(true, 'engine was invoked properly');

    return { default: expected };
  });

  var engine = resolver.resolve('engine:@some-scope/some-module');

  assert.ok(engine, 'engine was returned');
  assert.equal(engine, expected, 'default export was returned');
});

test('can lookup a route-map', function (assert) {
  assert.expect(3);

  let expected = { isRouteMap: true };
  loader.define('appkit/routes', [], function () {
    assert.ok(true, 'route-map was invoked properly');

    return { default: expected };
  });

  let routeMap = resolver.resolve('route-map:appkit');

  assert.ok(routeMap, 'route-map was returned');
  assert.equal(routeMap, expected, 'default export was returned');
});

// the assert.expectWarning helper no longer works
test.skip('warns if looking up a camelCase helper that has a dasherized module present', function (assert) {
  assert.expect(1);

  loader.define('appkit/helpers/reverse-list', [], function () {
    return { default: { isHelperInstance: true } };
  });

  var helper = resolver.resolve('helper:reverseList');

  assert.ok(!helper, 'no helper was returned');
  // assert.expectWarning('Attempted to lookup "helper:reverseList" which was not found. In previous versions of ember-resolver, a bug would have caused the module at "appkit/helpers/reverse-list" to be returned for this camel case helper name. This has been fixed. Use the dasherized name to resolve the module that would have been returned in previous versions.');
});

test('errors if lookup of a route-map does not specify isRouteMap', function (assert) {
  assert.expect(2);

  let expected = { isRouteMap: false };
  loader.define('appkit/routes', [], function () {
    assert.ok(true, 'route-map was invoked properly');

    return { default: expected };
  });

  assert.throws(() => {
    resolver.resolve('route-map:appkit');
  }, /The route map for appkit should be wrapped by 'buildRoutes' before exporting/);
});

test("will return the raw value if no 'default' is available", function (assert) {
  loader.define('appkit/fruits/orange', [], function () {
    return 'is awesome';
  });

  assert.equal(
    resolver.resolve('fruit:orange'),
    'is awesome',
    'adapter was returned'
  );
});

test("will unwrap the 'default' export automatically", function (assert) {
  loader.define('appkit/fruits/orange', [], function () {
    return { default: 'is awesome' };
  });

  assert.equal(
    resolver.resolve('fruit:orange'),
    'is awesome',
    'adapter was returned'
  );
});

test('router:main is hard-coded to prefix/router.js', function (assert) {
  assert.expect(1);

  loader.define('appkit/router', [], function () {
    assert.ok(true, 'router:main was looked up');
    return 'whatever';
  });

  resolver.resolve('router:main');
});

test('store:main is looked up as prefix/store', function (assert) {
  assert.expect(1);

  loader.define('appkit/store', [], function () {
    assert.ok(true, 'store:main was looked up');
    return 'whatever';
  });

  resolver.resolve('store:main');
});

test('store:posts as prefix/stores/post', function (assert) {
  assert.expect(1);

  loader.define('appkit/stores/post', [], function () {
    assert.ok(true, 'store:post was looked up');
    return 'whatever';
  });

  resolver.resolve('store:post');
});

test('will raise error if both dasherized and underscored modules exist', function (assert) {
  loader.define('appkit/big-bands/steve-miller-band', [], function () {
    assert.ok(true, 'dasherized version looked up');
    return 'whatever';
  });

  loader.define('appkit/big_bands/steve_miller_band', [], function () {
    assert.ok(false, 'underscored version looked up');
    return 'whatever';
  });

  try {
    resolver.resolve('big-band:steve-miller-band');
  } catch (e) {
    assert.equal(
      e.message,
      `Ambiguous module names: 'appkit/big-bands/steve-miller-band' and 'appkit/big_bands/steve_miller_band'`,
      'error with a descriptive value is thrown'
    );
  }
});

test('will lookup an underscored version of the module name when the dasherized version is not found', function (assert) {
  assert.expect(1);

  loader.define('appkit/big_bands/steve_miller_band', [], function () {
    assert.ok(true, 'underscored version looked up properly');
    return 'whatever';
  });

  resolver.resolve('big-band:steve-miller-band');
});

test('can lookup templates with mixed naming moduleName', function (assert) {
  assert.expect(1);

  loader.define('appkit/bands/_steve-miller-band', [], function () {
    assert.ok(true, 'underscored version looked up properly');

    return 'whatever';
  });

  resolver.resolve('band:-steve-miller-band');

  // TODO: these helpers not not compatible with modern ember
  // assert.expectDeprecation('Modules should not contain underscores. Attempted to lookup "appkit/bands/-steve-miller-band" which was not found. Please rename "appkit/bands/_steve-miller-band" to "appkit/bands/-steve-miller-band" instead.');
});

test('can lookup templates via Ember.TEMPLATES', function (assert) {
  Ember.TEMPLATES['application'] = function () {
    return '<h1>herp</h1>';
  };

  var template = resolver.resolve('template:application');
  assert.ok(template, 'template should resolve');
});

test('it provides eachForType which invokes the callback for each item found', function (assert) {
  function orange() {}
  loader.define('appkit/fruits/orange', [], function () {
    return { default: orange };
  });

  function apple() {}
  loader.define('appkit/fruits/apple', [], function () {
    return { default: apple };
  });

  function other() {}
  loader.define('appkit/stuffs/other', [], function () {
    return { default: other };
  });

  var items = resolver.knownForType('fruit');

  assert.deepEqual(items, {
    'fruit:orange': true,
    'fruit:apple': true,
  });
});

test('eachForType can find both pod and non-pod factories', function (assert) {
  function orange() {}
  loader.define('appkit/fruits/orange', [], function () {
    return { default: orange };
  });

  function lemon() {}
  loader.define('appkit/lemon/fruit', [], function () {
    return { default: lemon };
  });

  var items = resolver.knownForType('fruit');

  assert.deepEqual(items, {
    'fruit:orange': true,
    'fruit:lemon': true,
  });
});

test('if shouldWrapInClassFactory returns true a wrapped object is returned', function (assert) {
  resolver.shouldWrapInClassFactory = function (defaultExport, parsedName) {
    assert.equal(defaultExport, 'foo');
    assert.equal(parsedName.fullName, 'string:foo');

    return true;
  };

  loader.define('appkit/strings/foo', [], function () {
    return { default: 'foo' };
  });

  var value = resolver.resolve('string:foo');

  assert.equal(value.create(), 'foo');
});

test('normalization', function (assert) {
  assert.ok(resolver.normalize, 'resolver#normalize is present');

  assert.equal(resolver.normalize('foo:bar'), 'foo:bar');

  assert.equal(resolver.normalize('controller:posts'), 'controller:posts');
  assert.equal(
    resolver.normalize('controller:posts_index'),
    'controller:posts-index'
  );
  assert.equal(
    resolver.normalize('controller:posts.index'),
    'controller:posts/index'
  );
  assert.equal(
    resolver.normalize('controller:posts-index'),
    'controller:posts-index'
  );
  assert.equal(
    resolver.normalize('controller:posts.post.index'),
    'controller:posts/post/index'
  );
  assert.equal(
    resolver.normalize('controller:posts_post.index'),
    'controller:posts-post/index'
  );
  assert.equal(
    resolver.normalize('controller:posts.post_index'),
    'controller:posts/post-index'
  );
  assert.equal(
    resolver.normalize('controller:posts.post-index'),
    'controller:posts/post-index'
  );
  assert.equal(
    resolver.normalize('controller:postsIndex'),
    'controller:posts-index'
  );
  assert.equal(
    resolver.normalize('controller:blogPosts.index'),
    'controller:blog-posts/index'
  );
  assert.equal(
    resolver.normalize('controller:blog/posts.index'),
    'controller:blog/posts/index'
  );
  assert.equal(
    resolver.normalize('controller:blog/posts-index'),
    'controller:blog/posts-index'
  );
  assert.equal(
    resolver.normalize('controller:blog/posts.post.index'),
    'controller:blog/posts/post/index'
  );
  assert.equal(
    resolver.normalize('controller:blog/posts_post.index'),
    'controller:blog/posts-post/index'
  );
  assert.equal(
    resolver.normalize('controller:blog/posts_post-index'),
    'controller:blog/posts-post-index'
  );

  assert.equal(
    resolver.normalize('template:blog/posts_index'),
    'template:blog/posts-index'
  );
  assert.equal(resolver.normalize('service:userAuth'), 'service:user-auth');

  // For helpers, we have special logic to avoid the situation of a template's
  // `{{someName}}` being surprisingly shadowed by a `some-name` helper
  assert.equal(
    resolver.normalize('helper:make-fabulous'),
    'helper:make-fabulous'
  );
  assert.equal(resolver.normalize('helper:fabulize'), 'helper:fabulize');
  assert.equal(
    resolver.normalize('helper:make_fabulous'),
    'helper:make-fabulous'
  );
  assert.equal(
    resolver.normalize('helper:makeFabulous'),
    'helper:makeFabulous'
  );

  // The same applies to components
  assert.equal(
    resolver.normalize('component:fabulous-component'),
    'component:fabulous-component'
  );
  assert.equal(
    resolver.normalize('component:fabulousComponent'),
    'component:fabulousComponent'
  );
  assert.equal(
    resolver.normalize('template:components/fabulousComponent'),
    'template:components/fabulousComponent'
  );

  // and modifiers
  assert.equal(
    resolver.normalize('modifier:fabulous-component'),
    'modifier:fabulous-component'
  );

  // deprecated when fabulously-missing actually exists, but normalize still returns it
  assert.equal(
    resolver.normalize('modifier:fabulouslyMissing'),
    'modifier:fabulouslyMissing'
  );
});

test('camel case modifier is not normalized', function (assert) {
  assert.expect(2);

  let expected = {};
  loader.define('appkit/modifiers/other-thing', [], function () {
    assert.ok(false, 'appkit/modifiers/other-thing was accessed');

    return { default: 'oh no' };
  });

  loader.define('appkit/modifiers/otherThing', [], function () {
    assert.ok(true, 'appkit/modifiers/otherThing was accessed');

    return { default: expected };
  });

  let modifier = resolver.resolve('modifier:otherThing');

  assert.strictEqual(modifier, expected);
});

test('normalization is idempotent', function (assert) {
  let examples = [
    'controller:posts',
    'controller:posts.post.index',
    'controller:blog/posts.post_index',
    'template:foo_bar',
  ];

  examples.forEach((example) => {
    assert.equal(
      resolver.normalize(resolver.normalize(example)),
      resolver.normalize(example)
    );
  });
});

module('Logging', {
  beforeEach: function () {
    originalConsoleInfo = console ? console.info : null;
    logCalls = [];
    console.info = function (arg) {
      logCalls.push(arg);
    };
    setupResolver();
  },

  afterEach: function () {
    if (originalConsoleInfo) {
      console.info = originalConsoleInfo;
    }
  },
});

test('logs lookups when logging is enabled', function (assert) {
  loader.define('appkit/fruits/orange', [], function () {
    return 'is logged';
  });

  Ember.ENV.LOG_MODULE_RESOLVER = true;

  resolver.resolve('fruit:orange');

  assert.ok(logCalls.length, 'should log lookup');
});

test("doesn't log lookups if disabled", function (assert) {
  loader.define('appkit/fruits/orange', [], function () {
    return 'is not logged';
  });

  Ember.ENV.LOG_MODULE_RESOLVER = false;

  resolver.resolve('fruit:orange');

  assert.equal(logCalls.length, 0, 'should not log lookup');
});

module('custom prefixes by type', {
  beforeEach: setupResolver,
});

test('will use the prefix specified for a given type if present', function (assert) {
  setupResolver({
    namespace: {
      fruitPrefix: 'grovestand',
      modulePrefix: 'appkit',
    },
  });

  loader.define('grovestand/fruits/orange', [], function () {
    assert.ok(true, 'custom prefix used');
    return 'whatever';
  });

  resolver.resolve('fruit:orange');
});

module('pods lookup structure', {
  beforeEach: function () {
    setupResolver();
  },
});

test('will lookup modulePrefix/name/type before prefix/type/name', function (assert) {
  loader.define('appkit/controllers/foo', [], function () {
    assert.ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  loader.define('appkit/foo/controller', [], function () {
    assert.ok(true, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

test('will lookup names with slashes properly', function (assert) {
  loader.define('appkit/controllers/foo/index', [], function () {
    assert.ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  loader.define('appkit/foo/index/controller', [], function () {
    assert.ok(true, 'appkit/foo/index/controller was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo/index');
});

test('specifying a podModulePrefix overrides the general modulePrefix', function (assert) {
  setupResolver({
    namespace: {
      modulePrefix: 'appkit',
      podModulePrefix: 'appkit/pods',
    },
  });

  loader.define('appkit/controllers/foo', [], function () {
    assert.ok(false, 'appkit/controllers was used');
    return 'whatever';
  });

  loader.define('appkit/foo/controller', [], function () {
    assert.ok(false, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  loader.define('appkit/pods/foo/controller', [], function () {
    assert.ok(true, 'appkit/pods/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

test('will not use custom type prefix when using POD format', function (assert) {
  resolver.namespace['controllerPrefix'] = 'foobar';

  loader.define('foobar/controllers/foo', [], function () {
    assert.ok(false, 'foobar/controllers was used');
    return 'whatever';
  });

  loader.define('foobar/foo/controller', [], function () {
    assert.ok(false, 'foobar/foo/controllers was used');
    return 'whatever';
  });

  loader.define('appkit/foo/controller', [], function () {
    assert.ok(true, 'appkit/foo/controllers was used');
    return 'whatever';
  });

  resolver.resolve('controller:foo');
});

test('it will find components nested in app/components/name/index.js', function (assert) {
  loader.define('appkit/components/foo-bar/index', [], function () {
    assert.ok(true, 'appkit/components/foo-bar was used');

    return 'whatever';
  });

  resolver.resolve('component:foo-bar');
});

test('will lookup a components template without being rooted in `components/`', function (assert) {
  loader.define('appkit/components/foo-bar/template', [], function () {
    assert.ok(false, 'appkit/components was used');
    return 'whatever';
  });

  loader.define('appkit/foo-bar/template', [], function () {
    assert.ok(true, 'appkit/foo-bar/template was used');
    return 'whatever';
  });

  resolver.resolve('template:components/foo-bar');
});

test('will use pods format to lookup components in components/', function (assert) {
  assert.expect(3);

  let expectedComponent = { isComponentFactory: true };
  loader.define('appkit/components/foo-bar/template', [], function () {
    assert.ok(true, 'appkit/components was used');
    return 'whatever';
  });

  loader.define('appkit/components/foo-bar/component', [], function () {
    assert.ok(true, 'appkit/components was used');
    return { default: expectedComponent };
  });

  resolver.resolve('template:components/foo-bar');
  let component = resolver.resolve('component:foo-bar');

  assert.equal(component, expectedComponent, 'default export was returned');
});

test('will not lookup routes in components/', function (assert) {
  assert.expect(1);

  loader.define('appkit/components/foo-bar/route', [], function () {
    assert.ok(false, 'appkit/components was used');
    return { isRouteFactory: true };
  });

  loader.define('appkit/routes/foo-bar', [], function () {
    assert.ok(true, 'appkit/routes was used');
    return { isRouteFactory: true };
  });

  resolver.resolve('route:foo-bar');
});

test('will not lookup non component templates in components/', function (assert) {
  assert.expect(1);

  loader.define('appkit/components/foo-bar/template', [], function () {
    assert.ok(false, 'appkit/components was used');
    return 'whatever';
  });

  loader.define('appkit/templates/foo-bar', [], function () {
    assert.ok(true, 'appkit/templates was used');
    return 'whatever';
  });

  resolver.resolve('template:foo-bar');
});

module('custom pluralization');

test('will use the pluralization specified for a given type', function (assert) {
  assert.expect(1);

  setupResolver({
    namespace: {
      modulePrefix: 'appkit',
    },

    pluralizedTypes: {
      sheep: 'sheep',
      octipus: 'octipii',
    },
  });

  loader.define('appkit/sheep/baaaaaa', [], function () {
    assert.ok(true, 'custom pluralization used');
    return 'whatever';
  });

  resolver.resolve('sheep:baaaaaa');
});

test("will pluralize 'config' as 'config' by default", function (assert) {
  assert.expect(1);

  setupResolver();

  loader.define('appkit/config/environment', [], function () {
    assert.ok(true, 'config/environment is found');
    return 'whatever';
  });

  resolver.resolve('config:environment');
});

test("'config' can be overridden", function (assert) {
  assert.expect(1);

  setupResolver({
    namespace: {
      modulePrefix: 'appkit',
    },

    pluralizedTypes: {
      config: 'super-duper-config',
    },
  });

  loader.define('appkit/super-duper-config/environment', [], function () {
    assert.ok(true, 'super-duper-config/environment is found');
    return 'whatever';
  });

  resolver.resolve('config:environment');
});
