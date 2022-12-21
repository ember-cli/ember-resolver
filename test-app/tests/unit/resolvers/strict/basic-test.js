/* globals define, requirejs */

import { assign } from "@ember/polyfills";
import { module, test } from "qunit";
import { setupTest } from "ember-qunit";
import Resolver from "ember-resolver/resolvers/strict";

let originalRegistryEntries, resolver;

function setupResolver(options) {
  if (!options) {
    options = { namespace: { modulePrefix: "foo-bar" } };
  }

  resolver = Resolver.create(options);
}

function resetRegistry() {
  requirejs.clear();
  assign(requirejs.entries, originalRegistryEntries);
}

module("ember-resolver/resolvers/strict", function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    originalRegistryEntries = assign({}, requirejs.entries);

    setupResolver();
  });

  hooks.afterEach(function () {
    resetRegistry();
  });

  test("does not require `namespace` to exist at `init` time", function (assert) {
    assert.expect(0);

    Resolver.create();
  });

  test("is module based", function (assert) {
    assert.strictEqual(
      resolver.moduleBasedResolver,
      true,
      "resolver declares itself module-based to enable router features"
    );
  });

  test("moduleNameForFullName", function (assert) {
    const testPairs = [
      ["route:application", "foo-bar/routes/application"],
      ["route:application/index", "foo-bar/routes/application/index"],
      ["application:main", "foo-bar/application"],
      ["route:foo.bar.baz.index", "foo-bar/routes/foo/bar/baz/index"],
      ["config:environment", "foo-bar/config/environment"],
    ];

    assert.expect(testPairs.length);

    testPairs.forEach((pair) => {
      assert.equal(
        resolver.moduleNameForFullName(pair[0]),
        pair[1],
        `fullName was not resolved correctly for ${pair[0]}`
      );
    });
  });

  test("can lookup something", function (assert) {
    assert.expect(2);

    define("foo-bar/adapters/post", [], function () {
      assert.ok(true, "adapter was invoked properly");

      return {};
    });

    var adapter = resolver.resolve("adapter:post");

    assert.ok(adapter, "adapter was returned");
  });

  test("can lookup something in another namespace", function (assert) {
    assert.expect(3);

    let expected = {};

    define("other/adapters/post", [], function () {
      assert.ok(true, "adapter was invoked properly");

      return {
        default: expected,
      };
    });

    var adapter = resolver.resolve("other@adapter:post");

    assert.ok(adapter, "adapter was returned");
    assert.equal(adapter, expected, "default export was returned");
  });

  test("can lookup something in another namespace with different syntax", function (assert) {
    assert.expect(3);

    let expected = {};
    define("other/adapters/post", [], function () {
      assert.ok(true, "adapter was invoked properly");

      return { default: expected };
    });

    var adapter = resolver.resolve("adapter:other@post");

    assert.ok(adapter, "adapter was returned");
    assert.equal(adapter, expected, "default export was returned");
  });

  test("can lookup a helper", function (assert) {
    assert.expect(3);

    let expected = { isHelperInstance: true };
    define("foo-bar/helpers/reverse-list", [], function () {
      assert.ok(true, "helper was invoked properly");

      return { default: expected };
    });

    var helper = resolver.resolve("helper:reverse-list");

    assert.ok(helper, "helper was returned");
    assert.equal(helper, expected, "default export was returned");
  });

  test("can lookup an engine", function (assert) {
    assert.expect(3);

    let expected = {};
    define("foo-bar/engine", [], function () {
      assert.ok(true, "engine was invoked properly");

      return { default: expected };
    });

    let engine = resolver.resolve("engine:foo-bar");

    assert.ok(engine, "engine was returned");
    assert.equal(engine, expected, "default export was returned");
  });

  test("can lookup a route-map", function (assert) {
    assert.expect(3);

    let expected = { isRouteMap: true };
    define("foo-bar/routes", [], function () {
      assert.ok(true, "route-map was invoked properly");

      return { default: expected };
    });

    let routeMap = resolver.resolve("route-map:foo-bar");

    assert.ok(routeMap, "route-map was returned");
    assert.equal(routeMap, expected, "default export was returned");
  });

  test("warns if normalizations up a camelCase service name", function (assert) {
    assert.expect(1);

    define("foo-bar/services/reverse-list", [], function () {
      return { default: { isHelperInstance: true } };
    });

    assert.equal(
      "service:reverseList",
      resolver.normalize("service:reverseList"),
      "no service was returned"
    );
    // assert.expectWarning(
    //   'Attempted to lookup "service:reverseList". Use "service:reverse-list" instead.'
    // );
  });

  test("will unwrap the 'default' export automatically", function (assert) {
    define("foo-bar/fruits/orange", [], function () {
      return { default: "is awesome" };
    });

    assert.equal(
      resolver.resolve("fruit:orange"),
      "is awesome",
      "adapter was returned"
    );
  });

  test("router:main is hard-coded to prefix/router.js", function (assert) {
    assert.expect(1);

    define("foo-bar/router", [], function () {
      assert.ok(true, "router:main was looked up");
      return "whatever";
    });

    resolver.resolve("router:main");
  });

  test("store:main is looked up as prefix/store", function (assert) {
    assert.expect(1);

    define("foo-bar/store", [], function () {
      assert.ok(true, "store:main was looked up");
      return "whatever";
    });

    resolver.resolve("store:main");
  });

  test("store:posts as prefix/stores/post", function (assert) {
    assert.expect(1);

    define("foo-bar/stores/post", [], function () {
      assert.ok(true, "store:post was looked up");
      return "whatever";
    });

    resolver.resolve("store:post");
  });

  test("can lookup a component template in another namespace with different syntax", function (assert) {
    assert.expect(2);

    let expected = { isTemplate: true };
    define("other/templates/components/foo-bar", [], function () {
      assert.ok(true, "template was looked up properly");

      return { default: expected };
    });

    var template = resolver.resolve("template:components/other@foo-bar");

    assert.equal(template, expected, "default export was returned");
  });

  test("does not lookup index when top level component is specified (route:view)", function (assert) {
    assert.expect(1);

    define("foo-bar/routes/view/index", [], function () {
      assert.ok(false, "should not have been required");
    });

    assert.ok(!resolver.resolve("route:view"), "route was not returned");
  });

  test("can lookup an engine from a scoped package", function (assert) {
    assert.expect(3);

    let expected = {};
    define("@some-scope/some-module/engine", [], function () {
      assert.ok(true, "engine was invoked properly");

      return { default: expected };
    });

    var engine = resolver.resolve("engine:@some-scope/some-module");

    assert.ok(engine, "engine was returned");
    assert.equal(engine, expected, "default export was returned");
  });

  test("can lookup something in another namespace with an @ scope", function (assert) {
    assert.expect(3);

    let expected = {};

    define("@scope/other/adapters/post", [], function () {
      assert.ok(true, "adapter was invoked properly");

      return {
        default: expected,
      };
    });

    var adapter = resolver.resolve("@scope/other@adapter:post");

    assert.ok(adapter, "adapter was returned");
    assert.equal(adapter, expected, "default export was returned");
  });
});
