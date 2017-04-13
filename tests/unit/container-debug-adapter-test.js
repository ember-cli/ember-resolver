import { module, test } from 'qunit';
import Ember from 'ember';
import Resolver from 'ember-resolver/resolver';
import ContainerDebugAdapter from 'ember-resolver/resolvers/classic/container-debug-adapter';
import ContainerDebugAdapterInitializer from 'dummy/initializers/container-debug-adapter';

let containerDebugAdapter, App;

let modules = {};
function def(_module) {
  modules[_module] = {};
}

function undef(_module) {
  if (_module) {
    delete modules[_module];
  } else {
    modules = {};
  }
}


module("Container Debug Adapter Tests", {
  beforeEach:function() {
    let BaseApplication = Ember.Application.extend({
      Resolver,
      ContainerDebugAdapter,
      modulePrefix: 'appkit',

      init() {
        this._super(...arguments);
        this.deferReadiness();
      },

      toString() {
        return 'App';
      }
    });

    BaseApplication.initializer(ContainerDebugAdapterInitializer);

    Ember.run(function() {
      App = BaseApplication.create();
    });

    Ember.run(function() {
      containerDebugAdapter = App.__container__.lookup('container-debug-adapter:main');
      containerDebugAdapter._moduleRegistry._entries = modules;
    });
  },
  afterEach: function() {
    Ember.run(function() {
      containerDebugAdapter.destroy();
      App.destroy();
      App = null;
    });
    undef();
  }
});

test("can access Container Debug Adapter which can catalog typical entries by type", function(assert) {
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('model'), true, "canCatalogEntriesByType should return false for model");
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('template'), false, "canCatalogEntriesByType should return false for template");
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('controller'), true, "canCatalogEntriesByType should return true for controller");
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('route'), true, "canCatalogEntriesByType should return true for route");
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('view'), true, "canCatalogEntriesByType should return true for view");
});

test("the default ContainerDebugAdapter catalogs controller entries", function(assert) {
  def('appkit/controllers/foo');
  def('appkit/controllers/users/foo');

  let controllers = containerDebugAdapter.catalogEntriesByType('controller');

  assert.equal(controllers.length, 2, "controllers discovered");
  assert.equal(controllers[0], 'foo', "found the right class");
  assert.equal(controllers[1], 'users/foo', "the name is correct");
});

test("Does not duplicate entries", function(assert) {
  def('appkit/models/foo');
  def('appkit/more/models/foo');

  let models = containerDebugAdapter.catalogEntriesByType('model');

  assert.equal(models.length, 1, "Only one is returned");
  assert.equal(models[0], 'foo', "the name is correct");
});

test("Pods support", function(assert) {
  def('appkit/user/model');
  def('appkit/post/model');

  let models = containerDebugAdapter.catalogEntriesByType('model');

  assert.equal(models.length, 2, "All models are found");
  assert.equal(models[0], 'user', "the name is correct");
  assert.equal(models[1], 'post', "the name is correct");
});

test("Pods podModulePrefix support", function(assert) {
  App.podModulePrefix = 'my-prefix';

  def('my-prefix/user/model');
  def('my-prefix/users/user/model');

  let models = containerDebugAdapter.catalogEntriesByType('model');

  assert.equal(models.length, 2, "models discovered");
  assert.equal(models[0], 'user', "the name is correct");
  assert.equal(models[1], 'users/user', "the name is correct");
});
