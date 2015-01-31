(function() {
  "use strict";

  Ember.Application.initializer({
    name: 'container-debug-adapter',

    initialize: function(container, app) {
      var ContainerDebugAdapter = require('ember/container-debug-adapter');
      var Resolver = require('ember/resolver');

      container.register('container-debug-adapter:main', ContainerDebugAdapter);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  });
}());
