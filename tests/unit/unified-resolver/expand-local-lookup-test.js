import { module, test } from 'qunit';
import Resolver from 'dangerously-set-unified-resolver/unified-resolver';

let modulePrefix = 'test-prefix';

module('ember-resolver/unified-resolver #expandLocalLookup', {
});

class FakeRegistry {
  constructor(entries) {
    this._entries = entries;
    this._get = [];
  }

  getExport(moduleName) {
    this._get.push(moduleName);
    let module = this._entries[moduleName];
    if (module) {
      return module;
    }
    throw new Error(`Module not found: ${moduleName}`);
  }

  has(moduleName) {
    return !!this._entries[moduleName];
  }
}

test('expandLocalLookup expands to a namespace when the source is in a collection containing that type (with type in filename)', function(assert) {
  assert.expect(1);

  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [`${modulePrefix}/src/ui/components/my-form/my-input/component`]: { default: expectedObject }
  });

  let resolver = Resolver.create({
    namespace: {modulePrefix},
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        component: { definitiveCollection: 'components' }
      },
      collections: {
        components: {
          group: 'ui',
          types: [ 'component' ]
        }
      }
    }
  });

  let factoryName = resolver.expandLocalLookup('component:my-input', 'component:my-form');

  assert.strictEqual(factoryName, 'component:my-form/my-input', 'returns a module namespace of "my-form"');
});

test('expandLocalLookup expands to a namespace when the source is in a collection containing that type (with default type)', function(assert) {
  assert.expect(1);

  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [`${modulePrefix}/src/ui/components/my-form/my-input`]: { default: expectedObject }
  });

  let resolver = Resolver.create({
    namespace: {modulePrefix},
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        component: { definitiveCollection: 'components' }
      },
      collections: {
        components: {
          defaultType: 'component',
          group: 'ui',
          types: [ 'component' ]
        }
      }
    }
  });

  let factoryName = resolver.expandLocalLookup('component:my-input', 'component:my-form');

  assert.strictEqual(factoryName, 'component:my-form/my-input', 'returns a module namespace of "my-form"');
});

test('expandLocalLookup expands to a namespace when the source is in a collection containing that type (with named export)', function(assert) {
  assert.expect(1);

  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [`${modulePrefix}/src/ui/components/my-form/my-input`]: { component: expectedObject }
  });

  let resolver = Resolver.create({
    namespace: {modulePrefix},
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        component: { definitiveCollection: 'components' }
      },
      collections: {
        components: {
          group: 'ui',
          types: [ 'component' ]
        }
      }
    }
  });

  let factoryName = resolver.expandLocalLookup('component:my-input', 'component:my-form');

  assert.strictEqual(factoryName, 'component:my-form/my-input', 'returns a module namespace of "my-form"');
});

test('expandLocalLookup returns null when no module exists in a namespaces lookup', function(assert) {
  assert.expect(1);

  let fakeRegistry = new FakeRegistry({
  });

  let resolver = Resolver.create({
    namespace: {modulePrefix},
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        component: { definitiveCollection: 'components' }
      },
      collections: {
        components: {
          group: 'ui',
          types: [ 'component' ]
        }
      }
    }
  });

  let factoryName = resolver.expandLocalLookup('component:my-input', 'component:my-form');

  assert.strictEqual(factoryName, null, 'returns null when there is no local lookup module');
});

test('expandLocalLookup expands to a namespace when the source is in a private collection', function(assert) {
  assert.expect(1);

  let fakeRegistry = new FakeRegistry({
    [`${modulePrefix}/src/ui/routes/my-route/-components/my-component/my-helper/helper`]: { default: {} }
  });

  let resolver = Resolver.create({
    namespace: {modulePrefix},
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        component: { definitiveCollection: 'components' },
        helper: { definitiveCollection: 'components' }
      },
      collections: {
        routes: {
          group: 'ui',
          types: [],
          privateCollections: ['components']
        },
        components: {
          group: 'ui',
          types: ['helper', 'component']
        }
      }
    }
  });

  let factoryName = resolver.expandLocalLookup('helper:my-helper', 'component:my-route/-components/my-component');

  assert.strictEqual(factoryName, 'helper:my-route/-components/my-component/my-helper', '-component namespace included in lookup');
});

test('expandLocalLookup expands to a private collection', function(assert) {
  assert.expect(1);

  let fakeRegistry = new FakeRegistry({
    [`${modulePrefix}/src/ui/routes/my-route/-components/my-helper/helper`]: { default: {} }
  });

  let resolver = Resolver.create({
    namespace: {modulePrefix},
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        template: {
          definitiveCollection: 'routes',
          fallbackCollectionPrefixes: {
            'components/': 'components'
          }
        },
        helper: { definitiveCollection: 'components' }
      },
      collections: {
        routes: {
          group: 'ui',
          types: ['template'],
          privateCollections: ['components']
        },
        components: {
          group: 'ui',
          types: ['helper']
        }
      }
    }
  });

  let factoryName = resolver.expandLocalLookup('helper:my-helper', 'template:my-route');

  assert.strictEqual(factoryName, 'helper:my-route/-components/my-helper', '-component namespace included in lookup');
});

test('expandLocalLookup returns null when no module exists in a private collection', function(assert) {
  assert.expect(1);

  let fakeRegistry = new FakeRegistry({});

  let resolver = Resolver.create({
    namespace: {modulePrefix},
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        template: {
          definitiveCollection: 'routes',
          fallbackCollectionPrefixes: {
            'components/': 'components'
          }
        },
        helper: { definitiveCollection: 'components' }
      },
      collections: {
        routes: {
          group: 'ui',
          types: ['template'],
          privateCollections: ['components']
        },
        components: {
          group: 'ui',
          types: ['helper']
        }
      }
    }
  });

  let factoryName = resolver.expandLocalLookup('helper:my-helper', 'template:my-route');

  assert.strictEqual(factoryName, null, '-component namespace included in lookup');
});
