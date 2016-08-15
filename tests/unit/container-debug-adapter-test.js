import { module, test } from 'qunit';
import Ember from 'ember';
import Resolver from 'ember-resolver';
import ContainerDebugAdapter from 'ember-resolver/container-debug-adapter';
import ContainerDebugAdapterInitializer from 'dummy/initializers/container-debug-adapter';

let containerDebugAdapter, App;

var modules = {};
function defineModule(fakeModule) {
  modules[fakeModule] = {};
}

function undefineModule(fakeModule) {
  if (fakeModule) {
    delete modules[fakeModule];
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
    undefineModule();
  }
});

test("can access Container Debug Adapter which can catalog typical entries by type", function(assert) {
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('model'), true, "canCatalogEntriesByType should return false for model");
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('template'), true, "canCatalogEntriesByType should return false for template");
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('controller'), true, "canCatalogEntriesByType should return true for controller");
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('route'), true, "canCatalogEntriesByType should return true for route");
  assert.equal(containerDebugAdapter.canCatalogEntriesByType('view'), true, "canCatalogEntriesByType should return true for view");
});

test("the default ContainerDebugAdapter catalogs controller entries", function(assert) {
  defineModule('appkit/controllers/foo');
  defineModule('appkit/controllers/users/foo');

  var controllers = containerDebugAdapter.catalogEntriesByType('controller');

  assert.equal(controllers.length, 2, `controllers discovered (${controllers.length})`);
  assert.equal(controllers[0], 'foo', `found class (${controllers[0]})`);
  assert.equal(controllers[1], 'users/foo', `the name (${controllers[1]}) is correct`);
});

test("Does not duplicate entries", function(assert) {
  defineModule('appkit/models/foo');
  defineModule('appkit/more/models/foo');

  var models = containerDebugAdapter.catalogEntriesByType('model');

  assert.equal(models.length, 1, "Only one is returned");
  assert.equal(models[0], 'foo', "the name is correct");
});

test("Pods support", function(assert) {
  defineModule('appkit/user/model');
  defineModule('appkit/post/model');

  var models = containerDebugAdapter.catalogEntriesByType('model');

  assert.equal(models.length, 2, "All models are found");
  assert.equal(models[0], 'user', "the name is correct");
  assert.equal(models[1], 'post', "the name is correct");
});

test("Pods podModulePrefix support", function(assert) {
  App.podModulePrefix = 'my-prefix';

  defineModule('my-prefix/user/model');
  defineModule('my-prefix/users/user/model');

  var models = containerDebugAdapter.catalogEntriesByType('model');

  assert.equal(models.length, 2, "models discovered");
  assert.equal(models[0], 'user', "the name is correct");
  assert.equal(models[1], 'users/user', "the name is correct");
});
