/* globals requirejs */

import Ember from 'ember';
import { module, test } from 'qunit';
import Resolver from 'ember-resolver/unified-resolver';

function resetRegistry() {
  requirejs.clear();
  Ember.merge(requirejs.entries, originalRegistryEntries);
}

let originalRegistryEntries, originalEmberDeprecate, originalEmberLoggerInfo;

module('ember-resolver/unified-resolver', {
  beforeEach() {
    this.namespace = 'test-namespace';
    originalRegistryEntries = Ember.merge({}, requirejs.entries);
    originalEmberDeprecate = Ember.deprecate;
    originalEmberLoggerInfo = Ember.Logger.info;
  },

  afterEach() {
    resetRegistry();
    Ember.deprecate = originalEmberDeprecate;
    Ember.Logger.info = originalEmberLoggerInfo;
  }
});

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

test('resolving router:main loads src/router.js', function(assert) {
  assert.expect(1);

  let expectedPath = `${this.namespace}/router`;
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

  let factory = resolver.resolve('router:main', { namespace: this.namespace });
  assert.deepEqual(factory, expectedObject, 'factory returned');
});

test('resolving an unknown type throws an error', function(assert) {
  assert.expect(2);

  let expectedPath = `${this.namespace}/unresolvable`;
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
    resolver.resolve('unresolvable:main', { namespace: this.namespace });
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
    resolver.resolve('router:main', { namespace: this.namespace });
  }, `Could not find module \`${this.namespace}/router\` imported from \`(require)\``);
});

/*
 * "Rule 2" of the unification RFC.
 *
 * See: https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md#module-type
 */

test('resolving service:i18n requires src/services/i18n/service.js', function(assert) {
  let resolver = Resolver.create({
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

  let expected = {};
  define(`${this.namespace}/services/i18n/service`, ['exports'], function(exports) {
    assert.ok(true, 'should be invoked');
    exports.default = expected;
  });

  assert.strictEqual(resolver.resolve('service:i18n', {namespace: this.namespace}), expected, 'service is resolved');
});

/*
 * "Rule 2" of the unification RFC with a group.
 */

test('resolving helper:capitalize requires src/ui/components/capitalize/helper.js', function(assert) {
  let resolver = Resolver.create({
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

  let expected = {};
  define(`${this.namespace}/ui/components/capitalize/helper`, ['exports'], function(exports) {
    assert.ok(true, 'should be invoked');
    exports.default = expected;
  });

  assert.strictEqual(resolver.resolve('helper:capitalize', {namespace: this.namespace}), expected, 'helper is resolved');
});

test('resolving component:capitalize requires src/ui/components/capitalize.js', function(assert) {
  let resolver = Resolver.create({
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

  let expected = {};
  define(`${this.namespace}/ui/components/capitalize`, ['exports'], function(exports) {
    assert.ok(true, 'should be invoked');
    exports.default = expected;
  });

  assert.strictEqual(resolver.resolve('component:capitalize', {namespace: this.namespace}), expected, 'component is resolved');
});



/*
 * "Rule 3" of the unification RFC. Rule 3 means a default type for a collection
 * is configured.
 */

test('resolving service:i18n requires src/services/i18n.js', function(assert) {
  let resolver = Resolver.create({
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

  let expected = {};
  define(`${this.namespace}/services/i18n`, ['exports'], function(exports) {
    assert.ok(true, 'should be invoked');
    exports.default = expected;
  });

  assert.strictEqual(resolver.resolve('service:i18n', {namespace: this.namespace}), expected, 'service is resolved');
});

test('resolving service:i18n throws when src/services/i18n.js register without default', function(assert) {
  let resolver = Resolver.create({
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

  let expected = {};
  define(`${this.namespace}/services/i18n`, ['exports'], function(exports) {
    assert.ok(true, 'should be invoked');
    exports.default = expected;
  });

  assert.throws(() => {
    resolver.resolve('service:i18n', {namespace: this.namespace});
  }, `Could not find module \`${this.namespace}/services/i18n\` imported from \`(require)\``);
});

test('resolving helper:capitalize requires src/ui/components/capitalize.js with `helper` named export', function(assert) {
  let resolver = Resolver.create({
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

  let expected = {};
  define(`${this.namespace}/ui/components/capitalize`, ['exports'], function(exports) {
    assert.ok(true, 'should be invoked');
    exports.helper = expected;
  });

  assert.strictEqual(resolver.resolve('helper:capitalize', {namespace: this.namespace}), expected, 'helper is resolved');
});


/**

to do:
 * figure out the signature for instantiating the resolver -- what is it now, and where does the new config stuff go in?
 * figure out how to stub requirejs/define appropriately so that we don't have to muck about with requirejs internals to clean up state between tests
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
