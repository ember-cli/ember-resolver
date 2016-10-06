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
    let val = this._entries[moduleName];
    if (!val) {
      throw new Error(`missing ${moduleName}`);
    }

    return val.default;
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

    if (!(expectedError instanceof RegExp)) {
      throw new Error(`typeof expectedError must be a RegExp, not "${expectedError}"`);
    }

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
      router: { definitiveCollection: '' }
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

expectResolutions({
  message: 'resolving an unknown type throws an error',
  config: {
    types: {
      router: { definitiveCollection: '' }
    },
    collections: {
      '': {
        types: [ 'router' ]
      }
    }
  },
  errors: {
    'unresolvable:main': new RegExp('"unresolvable" not a recognized type')
  }
});

expectResolutions({
  message: 'resolving router:main throws when module is not defined',
  namespace,
  config: {
    types: {
      router: { definitiveCollection: '' }
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
      service: { definitiveCollection: 'services' }
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
        definitiveCollection: 'components'
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
        definitiveCollection: 'components'
      },
      component: {
        definitiveCollection: 'components'
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
      service: { definitiveCollection: 'services' }
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
      service: { definitiveCollection: 'services' }
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
        definitiveCollection: 'components'
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

expectResolutions({
  message: 'resolving component:my-form/my-input to /ui/components/my-form/my-input',
  namespace,
  config: {
    types: {
      component: { definitiveCollection: 'components' }
    },
    collections: {
      components: {
        group: 'ui',
        types: [ 'component' ],
        defaultType: 'component'
      }
    }
  },
  moduleOverrides: {
    [`${namespace}/ui/components/my-form/my-input/component`]: null
  },
  resolutions: {
    'component:my-form/my-input': `${namespace}/ui/components/my-form/my-input`
  }
});

expectResolutions({
  message: 'resolving component:my-form/my-input to /ui/components/my-form/my-input/component',
  namespace,
  config: {
    types: {
      component: { definitiveCollection: 'components' }
    },
    collections: {
      components: {
        group: 'ui',
        types: [ 'component' ],
        defaultType: 'component'
      }
    }
  },
  resolutions: {
    'component:my-form/my-input': `${namespace}/ui/components/my-form/my-input/component`
  }
});

test('resolving template:components/my-form/my-input to /ui/components/my-form/my-input/template', function(assert) {
  assert.expect(3);

  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [`${namespace}/ui/components/my-form/my-input/template`]: { default: expectedObject }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        route: {
          definitiveCollection: 'routes'
        },
        template: {
          definitiveCollection: 'routes',
          fallbackCollectionPrefixes: {
            'components/': 'components'
          }
        }
      },
      collections: {
        components: {
          group: 'ui',
          types: [ 'template' ],
          defaultType: 'component'
        },
        routes: {
          group: 'ui',
          types: [ 'template' ],
          defaultType: 'route'
        }
      }
    }
  });

  assert.strictEqual(resolver.resolve('template:components/my-form/my-input', {namespace}), expectedObject, 'template is resolved');
  assert.throws(() => {
    resolver.resolve('template:my-form/my-input', {namespace});
  }, 'template not resolved at template:my-form/my-input');
  assert.throws(() => {
    resolver.resolve('template:my-form/-components/my-input', {namespace});
  }, 'template not resolved at template:my-form/-components/my-input');
});

test('resolving template:my-form/my-input to /ui/routes/my-form/my-input/template', function(assert) {
  assert.expect(2);

  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [`${namespace}/ui/routes/my-form/my-input/template`]: { default: expectedObject }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        route: {
          definitiveCollection: 'routes'
        },
        template: {
          definitiveCollection: 'routes',
          fallbackCollectionPrefixes: {
            'components/': 'components'
          }
        }
      },
      collections: {
        components: {
          group: 'ui',
          types: [ 'template' ],
          defaultType: 'component'
        },
        routes: {
          group: 'ui',
          types: [ 'template' ],
          defaultType: 'route'
        }
      }
    }
  });

  assert.strictEqual(resolver.resolve('template:my-form/my-input', {namespace}), expectedObject, 'template is resolved');
  assert.throws(() => {
    resolver.resolve('template:components/my-form/my-input', {namespace});
  }, 'template not resolved at template:components/my-form/my-input');
});

/**
 * Private Collections
 */
test('resolving template:my-form/-components/my-input to /ui/routes/my-form/-components/my-input/template', function(assert) {
  assert.expect(3);

  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [`${namespace}/ui/routes/my-form/-components/my-input/template`]: { default: expectedObject }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        route: {
          definitiveCollection: 'routes'
        },
        template: {
          definitiveCollection: 'routes',
          fallbackCollectionPrefixes: {
            'components/': 'components'
          }
        }
      },
      collections: {
        components: {
          group: 'ui',
          types: ['template'],
          defaultType: 'component'
        },
        routes: {
          group: 'ui',
          types: ['template'],
          defaultType: 'route',
          privateCollections: ['components']
        }
      }
    }
  });

  assert.strictEqual(resolver.resolve('template:my-form/-components/my-input', {namespace}), expectedObject, 'template is resolved');
  assert.throws(() => {
    resolver.resolve('template:components/my-form/my-input', {namespace});
  }, 'template not resolved at template:components/my-form/my-input');
  assert.throws(() => {
    resolver.resolve('template:my-form/my-input', {namespace});
  }, 'template not resolved at template:my-form/my-input');
});

test('failing to resolve component:my-form/my-input as /ui/components/my-form/-component/my-input', function(assert) {
  assert.expect(2);

  let expectedObject = {};
  let fakeRegistry = new FakeRegistry({
    [`${namespace}/ui/components/my-form/-components/my-input/component`]: { default: expectedObject }
  });

  let resolver = Resolver.create({
    _moduleRegistry: fakeRegistry,
    config: {
      types: {
        component: { definitiveCollection: 'components' }
      },
      collections: {
        components: {
          group: 'ui',
          types: [ 'component' ],
          privateCollections: ['components']
        }
      }
    }
  });

  assert.throws(() => {
    resolver.resolve('component:my-form/my-input', {namespace});
  }, 'component not resolved with full namespace');

  assert.throws(() => {
    resolver.resolve('component:my-input', {namespace});
  }, 'component not resolved with name');
});

/*
to do:
 * figure out the signature for instantiating the resolver -- what is it now, and where does the new config stuff go in?
 * figure out the structure of the config
 * the tests in resolver-test.js should be made to work simply by making the new resolver fallback to delegating to the old resolver
 *   ^^^ mixonic thinks this is incorrect. You should opt-in to the new resolver.
 *   Or perhaps only if you have a src dir?
 * Tests that show you cannot resolve anything from the utils directory, per spec
 * Tests that do private collections. Will involve respecting the `source` (I
 *   think) argument to the resolve method.
 * We need a word for `app` vs `src` (right now we call it namespace which is already used in the spec).


 ember-cli/loader.js  open issue, public API for require/define    can import from loader instead of global requirejs https://github.com/ember-cli/loader.js/issues/82
 (bug) we don't fallback to index (like node does)
 "import has from loader"  ember-load-initializers could refactor https://github.com/ember-cli/ember-load-initializers/blob/master/addon/index.js
 */
