/*globals define registry requirejs */

var resolver, 
    containerDebugAdapter, 
    App, get = Ember.get, 
    set = Ember.set, 
    Resolver = require('resolver'),
    ContainerDebugAdapter = require('container-debug-adapter'),
    Model = Ember.Object.extend();

module("Container Debug Adapter Tests", {
  setup:function() {
    Ember.run(function() {
      App = Ember.Application.extend({
        init: function () {
            this.deferReadiness();
            this._super.apply(this, arguments);
        },  
        toString: function() { return 'App'; },
        modulePrefix: 'appkit', 
        Resolver: Resolver['default'],
        ContainerDebugAdapter: ContainerDebugAdapter['default']
      }).create();     

      App.__container__.register('container-debug-adapter:main', ContainerDebugAdapter);
      containerDebugAdapter = App.__container__.lookup('container-debug-adapter:main');
    });
  },
  teardown: function() {
    Ember.run(function() {
      containerDebugAdapter.destroy();
      App.destroy();
      App = null;
    });
  }
});

test("can access App ", function(){
  equal(App.toString(), "App");
});

test("can access Container Debug Adapter which can catalog typical entries by type", function(){
  equal(containerDebugAdapter.canCatalogEntriesByType('model'), true, "canCatalogEntriesByType should return false for model");
  equal(containerDebugAdapter.canCatalogEntriesByType('template'), true, "canCatalogEntriesByType should return false for template");  
  equal(containerDebugAdapter.canCatalogEntriesByType('controller'), true, "canCatalogEntriesByType should return true for controller");
  equal(containerDebugAdapter.canCatalogEntriesByType('route'), true, "canCatalogEntriesByType should return true for route");
  equal(containerDebugAdapter.canCatalogEntriesByType('view'), true, "canCatalogEntriesByType should return true for view");
});

test("the default ContainerDebugAdapter catalogs controller entries", function(){
  define('appkit/controllers/foo', [ ] , function(){  return Ember.ObjectController.extend(); });


  var controllerClasses = containerDebugAdapter.catalogEntriesByType('controller');

  equal(controllerClasses.length, 1, "found 1 class");
  equal(controllerClasses[0].shortname, 'foo', "found the right class");
});
