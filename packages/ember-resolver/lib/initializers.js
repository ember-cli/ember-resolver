(function() {
  "use strict";

  Ember.Application.initializer({
    name: 'container-debug-adapter',

    initialize: function(container) {
      var ContainerDebugAdapter = require('ember/container-debug-adapter');
      var Resolver = require('ember/resolver');

      container.register('container-debug-adapter:main', ContainerDebugAdapter);
    }
  });
}());
