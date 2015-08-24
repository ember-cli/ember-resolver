(function() {
  "use strict";

  Ember.Application.initializer({
    name: 'container-debug-adapter',

    initialize: function() {
      var app = arguments[1] || arguments[0];
      var ContainerDebugAdapter = require('ember/container-debug-adapter');
      var Resolver = require('ember/resolver');

      app.register('container-debug-adapter:main', ContainerDebugAdapter);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  });
}());
