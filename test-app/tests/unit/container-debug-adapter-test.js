/* globals define, requirejs */
import { setupTest } from "ember-qunit";
import { module, test } from "qunit";

module("Container Debug Adapter Tests", function (hooks) {
  setupTest(hooks);

  let containerDebugAdapter;

  let modulesToReset;

  function def(moduleName) {
    define(moduleName, [], function () {});
    modulesToReset.push(moduleName);
  }

  hooks.beforeEach(function () {
    modulesToReset = [];
    containerDebugAdapter = this.owner.lookup("container-debug-adapter:main");
  });

  hooks.afterEach(function () {
    modulesToReset.forEach((moduleName) => {
      requirejs.unsee(moduleName);
      delete requirejs.entries[moduleName];
    });
  });

  test("can access Container Debug Adapter which can catalog typical entries by type", function (assert) {
    assert.equal(
      containerDebugAdapter.canCatalogEntriesByType("model"),
      true,
      "canCatalogEntriesByType should return false for model"
    );
    assert.equal(
      containerDebugAdapter.canCatalogEntriesByType("template"),
      false,
      "canCatalogEntriesByType should return false for template"
    );
    assert.equal(
      containerDebugAdapter.canCatalogEntriesByType("controller"),
      true,
      "canCatalogEntriesByType should return true for controller"
    );
    assert.equal(
      containerDebugAdapter.canCatalogEntriesByType("route"),
      true,
      "canCatalogEntriesByType should return true for route"
    );
    assert.equal(
      containerDebugAdapter.canCatalogEntriesByType("view"),
      true,
      "canCatalogEntriesByType should return true for view"
    );
  });

  test("the default ContainerDebugAdapter catalogs controller entries", function (assert) {
    def("test-app/controllers/foo");
    def("test-app/controllers/users/foo");

    let controllers = containerDebugAdapter.catalogEntriesByType("controller");

    assert.ok(controllers.includes("foo"), "foo controller was discovered");
    assert.ok(
      controllers.includes("users/foo"),
      "users/foo controller was discovered"
    );
  });

  test("Does not duplicate entries", function (assert) {
    def("test-app/models/foo");
    def("test-app/more/models/foo");

    let models = containerDebugAdapter.catalogEntriesByType("model");

    assert.equal(models.length, 1, "Only one is returned");
    assert.equal(models[0], "foo", "the name is correct");
  });

  test("Pods support", function (assert) {
    def("test-app/user/model");
    def("test-app/post/model");

    let models = containerDebugAdapter.catalogEntriesByType("model");

    assert.equal(models.length, 2, "All models are found");
    assert.equal(models[0], "user", "the name is correct");
    assert.equal(models[1], "post", "the name is correct");
  });

  test("Pods podModulePrefix support", function (assert) {
    const app = this.owner.lookup("application:main");

    app.podModulePrefix = "my-prefix";

    def("my-prefix/user/model");
    def("my-prefix/users/user/model");

    let models = containerDebugAdapter.catalogEntriesByType("model");

    assert.equal(models.length, 2, "models discovered");
    assert.equal(models[0], "user", "the name is correct");
    assert.equal(models[1], "users/user", "the name is correct");
  });
});
