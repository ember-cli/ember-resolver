/* jshint loopfunc:true */
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
  constructor({moduleOverrides}) {
    this._lastReturned = null;
    this._moduleOverrides = moduleOverrides || {};
  }

  get(moduleName, exportName = 'default') {
    if (Object.keys(this._moduleOverrides).indexOf(moduleName) !== -1) {
      let result = this._moduleOverrides[moduleName];
      if (!result) {
        throw new Error('missing: ' + moduleName);
      } else {
        return result;
      }
    }
    this._lastReturned = { moduleName, exportName };
    return {};
  }
}

function expectResolutions({ namespace, message, config, resolutions, moduleOverrides, errors }) {
  let fakeRegistry = new NewFakeRegistry({
    moduleOverrides
  });
  let resolver = Resolver.create({ config, _moduleRegistry: fakeRegistry });

  for (let lookupKey in resolutions) {
    let expectedModuleName = resolutions[lookupKey];
    let expectedExportName = 'default';

    if (expectedModuleName.indexOf(':') !== -1) {
      let pieces = expectedModuleName.split(':');
      expectedModuleName = pieces[0];
      expectedExportName = pieces[1];
    }
    test(`expectResolutions() - ${message} Resolves ${lookupKey} -> ${expectedModuleName}:${expectedExportName}`, function(assert) {
      resolver.resolve(lookupKey, { namespace });
      assert.deepEqual(fakeRegistry._lastReturned, { moduleName: expectedModuleName, exportName: expectedExportName });
    });
  }

  for(let lookupKey in errors) {
    let expectedError = errors[lookupKey];
    // TODO assert expectedError is a type RegExp and not a string
    test(`expectResolutions() - ${message} throws error when resolving ${lookupKey}`, function(assert) {
      assert.throws(() => {
        resolver.resolve(lookupKey, { namespace });
      }, expectedError, `threw '${expectedError}'`);
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

expectResolutions({
  message: 'resolving router:main throws when module is not defined',
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
  moduleOverrides: {
    [`${namespace}/router`]: null
  },
  errors: {
    'router:main': new RegExp(`missing: ${namespace}/router`)
  }
});

/*
 * "Rule 2" of the unification RFC.
 *
 * See: https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md#module-type
 */

expectResolutions({
  namespace,
  message: 'resolving service:i18n',
  config: {
    types: {
      service: { collection: 'services' }
    },
    collections: {
      services: {
        types: [ 'service' ]
      }
    }
  },
  resolutions: {
    'service:i18n': `${namespace}/services/i18n/service`
  }
});

/*
 * "Rule 2" of the unification RFC with a group.
 */

expectResolutions({
  message: 'rule 2 with a group',
  namespace,
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
  },
  resolutions: {
    'helper:capitalize': `${namespace}/ui/components/capitalize/helper`
  }
});

expectResolutions({
  message: 'rule 2 with a group and multiple types',
  namespace,
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
  },
  moduleOverrides: {
    [`${namespace}/ui/components/capitalize/component`]: null
  },
  resolutions: {
    'component:capitalize': `${namespace}/ui/components/capitalize`
  }
});

/*
 * "Rule 3" of the unification RFC. Rule 3 means a default type for a collection
 * is configured.
 */

expectResolutions({
  message: 'rule 3: resolving when a default type is configured',
  namespace,
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
  },
  moduleOverrides: {
    [`${namespace}/services/i18n/service`]: null
  },
  resolutions: {
    'service:i18n': `${namespace}/services/i18n`
  }
});

// Note: error format from require would be something like
// `Could not find module \`${namespace}/services/i18n\` imported from \`(require)\`
expectResolutions({
  message: 'rule 3: throws when missing default',
  namespace,
  config: {
    types: {
      service: { collection: 'services' }
    },
    collections: {
      services: {
        types: [ 'service' ]
      }
    }
  },
  moduleOverrides: {
    [`${namespace}/services/i18n`]: null,
    [`${namespace}/services/i18n/service`]: null
  },
  errors: {
    'service:i18n': new RegExp(`missing: ${namespace}/services/i18n`)
  }
});

expectResolutions({
  message: 'resolving with named "helper" export',
  namespace,
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
  },
  moduleOverrides: {
    [`${namespace}/ui/components/capitalize/helper`]: null
  },
  resolutions: {
    'helper:capitalize': `${namespace}/ui/components/capitalize:helper` // <-- if there's a ':', it means expect a named export (not "default")
  }
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
