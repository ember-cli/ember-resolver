/*globals define registry requirejs */

var resolver,
    containerDebugAdapter,
    App, get = Ember.get,
    set = Ember.set,
    Resolver = require('ember/resolver'),
    ContainerDebugAdapter = require('ember/container-debug-adapter'),
    Model = Ember.Object.extend();


var modules = {};
function def(module) {
  modules[module] = {};
}
function undef(module) {
  if (module) {
    delete modules[module];
  } else {
    modules = {};
  }
}


module("Container Debug Adapter Tests", {
  setup:function() {
    Ember.run(function() {
      App = Ember.Application.extend({
        init: function () {
            this._super.apply(this, arguments);
            this.deferReadiness();
        },
        toString: function() { return 'App'; },
        modulePrefix: 'appkit',
        Resolver: Resolver['default'],
        ContainerDebugAdapter: ContainerDebugAdapter['default']
      }).create();
    });
    Ember.run(function() {
      containerDebugAdapter = App.__container__.lookup('container-debug-adapter:main');
      containerDebugAdapter._getEntries = function() { return modules; };
    });
  },
  teardown: function() {
    Ember.run(function() {
      containerDebugAdapter.destroy();
      App.destroy();
      App = null;
    });
    undef();
  }
});

test("can access Container Debug Adapter which can catalog typical entries by type", function() {
  equal(containerDebugAdapter.canCatalogEntriesByType('model'), true, "canCatalogEntriesByType should return false for model");
  equal(containerDebugAdapter.canCatalogEntriesByType('template'), true, "canCatalogEntriesByType should return false for template");
  equal(containerDebugAdapter.canCatalogEntriesByType('controller'), true, "canCatalogEntriesByType should return true for controller");
  equal(containerDebugAdapter.canCatalogEntriesByType('route'), true, "canCatalogEntriesByType should return true for route");
  equal(containerDebugAdapter.canCatalogEntriesByType('view'), true, "canCatalogEntriesByType should return true for view");
});

test("the default ContainerDebugAdapter catalogs controller entries", function() {
  def('appkit/controllers/foo');
  def('appkit/controllers/users/foo');

  var controllers = containerDebugAdapter.catalogEntriesByType('controller');

  equal(controllers.length, 2, "controllers discovered");
  equal(controllers[0], 'foo', "found the right class");
  equal(controllers[1], 'users/foo', "the name is correct");
});

test("Does not duplicate entries", function() {
  def('appkit/models/foo');
  def('appkit/more/models/foo');

  var models = containerDebugAdapter.catalogEntriesByType('model');

  equal(models.length, 1, "Only one is returned");
  equal(models[0], 'foo', "the name is correct");
});

test("Pods support", function() {
  def('appkit/user/model');
  def('appkit/post/model');

  var models = containerDebugAdapter.catalogEntriesByType('model');

  equal(models.length, 2, "All models are found");
  equal(models[0], 'user', "the name is correct");
  equal(models[1], 'post', "the name is correct");
});

test("Pods podModulePrefix support", function() {
  App.podModulePrefix = 'my-prefix';

  def('my-prefix/user/model');
  def('my-prefix/users/user/model');

  var models = containerDebugAdapter.catalogEntriesByType('model');

  equal(models.length, 2, "models discovered");
  equal(models[0], 'user', "the name is correct");
  equal(models[1], 'users/user', "the name is correct");
});

