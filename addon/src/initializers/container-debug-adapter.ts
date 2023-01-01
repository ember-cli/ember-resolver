import type Application from '@ember/application';
import ContainerDebugAdapter from 'ember-resolver/resolvers/classic/container-debug-adapter';

export default {
  name: 'container-debug-adapter',

  initialize(app: Application) {
    app.register('container-debug-adapter:main', ContainerDebugAdapter);
  },
};
