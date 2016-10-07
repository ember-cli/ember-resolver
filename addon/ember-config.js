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
    application: { definitiveCollection: '' },
    controller: { definitiveCollection: 'routes' },
    component: { definitiveCollection: 'components' },
    event_dispatcher: { definitiveCollection: '' },
    initializer: { definitiveCollection: 'initializers' },
    'instance-initializers': { definitiveCollection: 'instance-initializer' },
    location: { definitiveCollection: '' },
    model: { definitiveCollection: 'models' },
    partial: { definitiveCollection: 'partials' },
    renderer: { definitiveCollection: '' },
    route: { definitiveCollection: 'routes' },
    router: { definitiveCollection: '' },
    serializer: { definitiveCollection: 'models' },
    service: { definitiveCollection: 'services' },
    template: {
      definitiveCollection: 'routes',
      fallbackCollectionPrefixes: {
        'components/': 'components'
      }
    },
    transform: { definitiveCollection: 'transforms' },
    util: { definitiveCollection: 'utils' },
    view: { definitiveCollection: 'views' },
    '-view-registry': { definitiveCollection: '' },
    '-bucket-cache': { definitiveCollection: '' }
  },
  unresolvableCollections: {
    utils: false
  },
  collections: {
    '': {
      types: ['router', '-bucket-cache', '-view-registry', 'event_dispatcher', 'application', 'location', 'renderer']
    },
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
    views: {
      types: ['view']
    },
    transforms: {
      group: 'data',
      types: ['transform']
    }
  }
};
