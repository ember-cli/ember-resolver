/*
 * This config describes canonical Ember, as described in the
 * module unification spec:
 *
 *   https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md
 *
 */
export default {
  types: {
    adapter: { definitiveCollection: 'models' },
    controller: { definitiveCollection: 'routes' },
    component: { definitiveCollection: 'components' },
    initializer: { definitiveCollection: 'initializers' },
    'instance-initializers': { definitiveCollection: 'instance-initializer' },
    model: { definitiveCollection: 'models' },
    partial: { definitiveCollection: 'partials' },
    route: { definitiveCollection: 'routes' },
    serializer: { definitiveCollection: 'models' },
    service: { definitiveCollection: 'services' },
    template: {
      definitiveCollection: 'routes',
      fallbackCollectionPrefixes: {
        'components/': 'components'
      }
    },
    transform: { definitiveCollection: 'transforms' },
    util: { definitiveCollection: 'utils' }
  },
  collections: {
    components: {
      group: 'ui',
      types: ['component', 'helper', 'template']
    },
    initializers: {
      group: 'init',
      types: ['initializer']
    },
    'instance-initializers': {
      group: 'init',
      types: ['instance-initializers']
    },
    models: {
      group: 'data',
      types: ['model', 'adapter', 'serializer']
    },
    partials: {
      group: 'ui',
      types: ['partial']
    },
    routes: {
      group: 'ui',
      privateCollections: ['components'],
      types: ['route', 'controller', 'template']
    },
    services: {
      types: ['service']
    },
    transforms: {
      group: 'data',
      types: ['transform']
    },
    utils: {
      resolvable: false
    }
  }
};
