/* globals requirejs */

import Ember from 'ember';
import { module, test, skip } from 'qunit';
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

test('resolving router:main loads src/router.js', function(assert) {
  assert.expect(2);
  let resolver = Resolver.create({
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

  let expected = {};
  define(`${this.namespace}/router`, [], function() {
    assert.ok(true, 'router was invoked correctly');
    return expected;
  });

  let factory = resolver.resolve('router:main', { namespace: this.namespace });
  assert.equal(factory, expected);
});

test('resolving an unknown type throws an error', function(assert) {
  assert.expect(1);
  let resolver = Resolver.create({
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

  let expected = {};
  define(`${this.namespace}/unresolvable`, [], function() {
    assert.ok(false, 'should not be invoked');
    return expected;
  });

  assert.throws(() => {
    resolver.resolve('unresolvable:main', { namespace: this.namespace });
  }, '"unresolvable" not a recognized type');
});

test('resolving router:main throws when module is not defined', function(assert) {
  assert.expect(1);
  let resolver = Resolver.create({
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
  define(`${this.namespace}/services/i18n/service`, [], function() {
    assert.ok(true, 'should be invoked');
    return expected;
  });

  assert.strictEqual(resolver.resolve('service:i18n', {namespace: this.namespace}), expected, 'service is resolved');
});

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
  define(`${this.namespace}/services/i18n`, [], function() {
    assert.ok(true, 'should be invoked');
    return expected;
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
  define(`${this.namespace}/services/i18n`, [], function() {
    assert.ok(true, 'should be invoked');
    return expected;
  });

  assert.throws(() => {
    resolver.resolve('service:i18n', {namespace: this.namespace});
  }, `Could not find module \`${this.namespace}/services/i18n\` imported from \`(require)\``);
});

skip('resolving helper:nested/capitalize requires src/ui/components/nested/capitalize/helper.js', function(assert) {
  let resolver = Resolver.create({
    config: {
      types: {
        helper: {
          collection: 'ui/components'
        }
      },
      collections: {
        'ui/components': {
          types: [ 'helper' ]
        }
      }
    }
  });

  let expected = {};
  define(`${this.namespace}/ui/components/nested/capitalize/helper`, [], function() {
    assert.ok(true, 'should be invoked');
    return expected;
  });

  assert.strictEqual(resolver.resolve('helper:nested/capitalize'), expected, 'helper is resolved');
});




/**

to do:
 * figure out the signature for instantiating the resolver -- what is it now, and where does the new config stuff go in?
 * figure out how to stub requirejs/define appropriately so that we don't have to muck about with requirejs internals to clean up state between tests
 * figure out the structure of the config
 * figure out whether the resolver ever reads anything other than the "default" export now, and whether that needs to change for new stuff (e.g., when some file/amd-module exports a named "helper" or "controller" etc)
 * the tests in resolver-test.js should be made to work simply by making the new resolver fallback to delegating to the old resolver
 * add new tests for new places that the module unification rfc says we should look for things -- need to read the spec to figure this out
 * figure out what the rfc says about how the config can influence how the looked-up module names change, and add tests for these scenarios (e.g., custom collection, private collections, etc)


 ember-cli/loader.js  open issue, public API for require/define    can import from loader instead of global requirejs https://github.com/ember-cli/loader.js/issues/82
 (bug) we don't fallback to index (like node does)
 "import has from loader"  ember-load-initializers could refactor https://github.com/ember-cli/ember-load-initializers/blob/master/addon/index.js
 */
