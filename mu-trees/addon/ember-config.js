/*
 * This config describes canonical Ember, as described in the
 * module unification spec:
 *
 *   https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md
 *
 */
export default function generateConfig(name) {
  return {
    app: {
      name,
      rootName: name
    },
    types: {
      adapter: { definitiveCollection: 'models' },
      application: { definitiveCollection: 'main' },
      controller: { definitiveCollection: 'routes' },
      component: { definitiveCollection: 'components' },
      'component-lookup': { definitiveCollection: 'main' },
      event_dispatcher: { definitiveCollection: 'main' },
      helper: { definitiveCollection: 'components' },
      initializer: { definitiveCollection: 'initializers' },
      'instance-initializers': { definitiveCollection: 'instance-initializer' },
      location: { definitiveCollection: 'main' },
      model: { definitiveCollection: 'models' },
      partial: { definitiveCollection: 'partials' },
      renderer: { definitiveCollection: 'main' },
      route: { definitiveCollection: 'routes' },
      router: { definitiveCollection: 'main' },
      serializer: { definitiveCollection: 'models' },
      service: { definitiveCollection: 'services' },
      template: { definitiveCollection: 'components' },
      transform: { definitiveCollection: 'transforms' },
      view: { definitiveCollection: 'views' },
      '-view-registry': { definitiveCollection: 'main' },
      '-bucket-cache': { definitiveCollection: 'main' }
    },
    collections: {
      'main': {
        types: ['router', '-bucket-cache', 'component-lookup', '-view-registry', 'event_dispatcher', 'application', 'location', 'renderer']
      },
      components: {
        group: 'ui',
        privateCollections: ['utils'],
        types: ['component', 'helper', 'template']
      },
      initializers: {
        group: 'init',
        defaultType: 'initializer',
        privateCollections: ['utils'],
        types: ['initializer']
      },
      'instance-initializers': {
        group: 'init',
        defaultType: 'instance-initializer',
        privateCollections: ['utils'],
        types: ['instance-initializers']
      },
      models: {
        group: 'data',
        defaultType: 'model',
        privateCollections: ['utils'],
        types: ['model', 'adapter', 'serializer']
      },
      partials: {
        group: 'ui',
        defaultType: 'partial',
        privateCollections: ['utils'],
        types: ['partial']
      },
      routes: {
        group: 'ui',
        defaultType: 'route',
        privateCollections: ['components', 'utils'],
        types: ['route', 'controller', 'template']
      },
      services: {
        defaultType: 'service',
        privateCollections: ['utils'],
        types: ['service']
      },
      utils: {
        unresolvable: true
      },
      views: {
        defaultType: 'view',
        privateCollections: ['utils'],
        types: ['view']
      },
      transforms: {
        group: 'data',
        defaultType: 'transform',
        privateCollections: ['utils'],
        types: ['transform']
      }
    }
  };
}
