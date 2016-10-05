import { module, test } from 'qunit';
import Resolver from 'ember-resolver/unified-resolver';

let namespace = 'test-namespace';

module('ember-resolver/unified-resolver', {});

/*
 * "Rule 1" of the unification RFC.
 *
 * See: https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md#module-type
 */

class FakeRegistry {
  constructor(entries) {
    this._entries = entries;
    this._get = [];
  }

  get(moduleName) {
    this._get.push(moduleName);
    return this._entries[moduleName];
  }
}

class NewFakeRegistry {
  constructor() {
    this._lastReturned = null;
  }

  get(moduleName, exportName = 'default') {
    this._lastReturned = { moduleName, exportName };
    return {};
  }
}

function expectResolutions({ namespace, message, config, resolutions }) {
  let fakeRegistry = new NewFakeRegistry();
  let resolver = Resolver.create({ config, _moduleRegistry: fakeRegistry });

  for (let lookupKey in resolutions) {
    let expectedModuleName = resolutions[lookupKey];
    test(`expectResolutions() - ${message} Resolves ${lookupKey} -> ${expectedModuleName}`, function(assert) {
      resolver.resolve(lookupKey, { namespace: namespace });
      assert.deepEqual(fakeRegistry._lastReturned, { moduleName: expectedModuleName, exportName: 'default' });
    });
  }
}

expectResolutions({
  message: 'Modules named main.',
  namespace,
  config: {
    types: {
      router: { collection: '' }
    },
    collections: {
      '': {
        types: [ 'router' ]
      }
    }
  },

  resolutions: {
    'router:main': `${namespace}/router`
  }
});

test('resolving an unknown type throws an error', function(assert) {
  assert.expect(2);

  let expectedPath = `${namespace}/unresolvable`;
  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [expectedPath]: { default: expectedObject }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        router: { collection: '' }
      },
      collections: {
        '': {
          types: [ 'router' ]
        }
      }
    }
  });

  assert.throws(() => {
    resolver.resolve('unresolvable:main', { namespace: namespace });
  }, '"unresolvable" not a recognized type');

  assert.equal(fakeRegistry._get.length, 0, 'nothing is required from registry');
});

test('resolving router:main throws when module is not defined', function(assert) {
  assert.expect(1);

  let fakeRegistry = new FakeRegistry();
  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        router: { collection: '' }
      },
      collections: {
        '': {
          types: [ 'router' ]
        }
      }
    }
  });

  assert.throws(() => {
    resolver.resolve('router:main', { namespace: namespace });
  }, `Could not find module \`${namespace}/router\` imported from \`(require)\``);
});

/*
 * "Rule 2" of the unification RFC.
 *
 * See: https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md#module-type
 */

test('resolving service:i18n requires src/services/i18n/service.js', function(assert) {
  assert.expect(1);

  let expectedPath = `${namespace}/services/i18n/service`;
  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [expectedPath]: { default: expectedObject }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        service: { collection: 'services' }
      },
      collections: {
        services: {
          types: [ 'service' ]
        }
      }
    }
  });

  assert.strictEqual(resolver.resolve('service:i18n', {namespace: namespace}), expectedObject, 'service is resolved');
});

/*
 * "Rule 2" of the unification RFC with a group.
 */

test('resolving helper:capitalize requires src/ui/components/capitalize/helper.js', function(assert) {
  assert.expect(1);

  let expectedPath = `${namespace}/ui/components/capitalize/helper`;
  let expected = {};
  let fakeRegistry = new FakeRegistry({
    [expectedPath]: { default: expected }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        helper: {
          collection: 'components'
        }
      },
      collections: {
        'components': {
          group: 'ui',
          types: [ 'helper' ]
        }
      }
    }
  });

  assert.strictEqual(resolver.resolve('helper:capitalize', {namespace: namespace}), expected, 'helper is resolved');
});

test('resolving component:capitalize requires src/ui/components/capitalize.js', function(assert) {
  assert.expect(1);

  let expectedPath = `${namespace}/ui/components/capitalize`;
  let expected = {};
  let fakeRegistry = new FakeRegistry({
    [expectedPath]: { default: expected }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        helper: {
          collection: 'components'
        },
        component: {
          collection: 'components'
        }
      },
      collections: {
        'components': {
          group: 'ui',
          defaultType: 'component',
          types: [ 'helper', 'component' ]
        }
      }
    }
  });

  assert.strictEqual(resolver.resolve('component:capitalize', {namespace: namespace}), expected, 'component is resolved');
});



/*
 * "Rule 3" of the unification RFC. Rule 3 means a default type for a collection
 * is configured.
 */

test('resolving service:i18n requires src/services/i18n.js', function(assert) {
  assert.expect(1);

  let expectedPath = `${namespace}/services/i18n`;
  let expected = {};
  let fakeRegistry = new FakeRegistry({
    [expectedPath]: { default: expected }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        service: { collection: 'services' }
      },
      collections: {
        services: {
          defaultType: 'service',
          types: [ 'service' ]
        }
      }
    }
  });

  assert.strictEqual(resolver.resolve('service:i18n', {namespace: namespace}), expected, 'service is resolved');
});

test('resolving service:i18n throws when src/services/i18n.js register without default', function(assert) {
  assert.expect(1);

  let expectedPath = `${namespace}/services/i18n`;
  let expected = {};
  let fakeRegistry = new FakeRegistry({
    [expectedPath]: { default: expected }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        service: { collection: 'services' }
      },
      collections: {
        services: {
          types: [ 'service' ]
        }
      }
    }
  });

  assert.throws(() => {
    resolver.resolve('service:i18n', {namespace: namespace});
  }, `Could not find module \`${namespace}/services/i18n\` imported from \`(require)\``);
});

test('resolving helper:capitalize requires src/ui/components/capitalize.js with `helper` named export', function(assert) {
  assert.expect(1);

  let expectedPath = `${namespace}/ui/components/capitalize`;
  let expected = {};
  let fakeRegistry = new FakeRegistry({
    [expectedPath]: { helper: expected }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        helper: {
          collection: 'components'
        }
      },
      collections: {
        components: {
          group: 'ui',
          types: [ 'helper' ]
        }
      }
    }
  });

  assert.strictEqual(resolver.resolve('helper:capitalize', {namespace: namespace}), expected, 'helper is resolved');
});


/**

to do:
 * figure out the signature for instantiating the resolver -- what is it now, and where does the new config stuff go in?
 * figure out the structure of the config
 * the tests in resolver-test.js should be made to work simply by making the new resolver fallback to delegating to the old resolver
 *   ^^^ mixonic thinks this is incorrect. You should opt-in to the new resolver.
 *   Or perhaps only if you have a src dir?
 * Tests that show you cannot resolve anything from the utils directory, per spec
 * Tests that do private collections. Will involve respecting the `source` (I
 *   think) argument to the resolve method.


 ember-cli/loader.js  open issue, public API for require/define    can import from loader instead of global requirejs https://github.com/ember-cli/loader.js/issues/82
 (bug) we don't fallback to index (like node does)
 "import has from loader"  ember-load-initializers could refactor https://github.com/ember-cli/ember-load-initializers/blob/master/addon/index.js
 */
