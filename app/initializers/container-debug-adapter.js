import ContainerDebugAdapter from 'ember-resolver/container-debug-adapter';

export default {
  name: 'container-debug-adapter',

  initialize: function() {
    var app = arguments[1] || arguments[0];

    app.register('container-debug-adapter:main', ContainerDebugAdapter);
    app.inject('container-debug-adapter:main', 'namespace', 'application:main');
  }
};
