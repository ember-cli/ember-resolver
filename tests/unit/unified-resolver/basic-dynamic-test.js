/* jshint loopfunc:true */
import { module, test } from 'qunit';
import Resolver from 'dangerously-set-unified-resolver/unified-resolver';

let modulePrefix = 'test-namespace';

module('ember-resolver/unified-resolver', {});

class NewFakeRegistry {
  constructor({moduleOverrides}) {
    this._lastReturned = null;
    this._moduleOverrides = moduleOverrides || {};
  }

  getExport(moduleName, exportName = 'default') {
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

  has(moduleName) {
    return this._moduleOverrides.hasOwnProperty(moduleName) ? this._moduleOverrides[moduleName] : true;
  }
}

function expectResolutions({ message, config, resolutions, moduleOverrides, errors, returns }) {
  let fakeRegistry = new NewFakeRegistry({
    moduleOverrides
  });
  let resolver = Resolver.create({
    config,
    _moduleRegistry: fakeRegistry,
    namespace: {modulePrefix}
  });

  for (let lookupKey in resolutions) {
    let expectedModuleName = resolutions[lookupKey];
    let expectedExportName = 'default';

    if (expectedModuleName.indexOf(':') !== -1) {
      let pieces = expectedModuleName.split(':');
      expectedModuleName = pieces[0];
      expectedExportName = pieces[1];
    }
    test(`expectResolutions() - ${message} Resolves ${lookupKey} -> ${expectedModuleName}:${expectedExportName}`, function(assert) {
      resolver.resolve(lookupKey);
      assert.deepEqual(fakeRegistry._lastReturned, { moduleName: expectedModuleName, exportName: expectedExportName });
    });
  }

  for(let lookupKey in returns) {
    let expectedValue = returns[lookupKey];

    test(`expectResolutions() - ${message} returns ${expectedValue} when resolving ${lookupKey}`, function(assert) {
      let response = resolver.resolve(lookupKey);
      assert.deepEqual(response, expectedValue);
    });
  }

  for(let lookupKey in errors) {
    let expectedError = errors[lookupKey];

    if (!(expectedError instanceof RegExp)) {
      throw new Error(`typeof expectedError must be a RegExp, not "${expectedError}"`);
    }

    test(`expectResolutions() - ${message} throws error when resolving ${lookupKey}`, function(assert) {
      assert.throws(() => {
        resolver.resolve(lookupKey);
      }, expectedError, `threw '${expectedError}'`);
    });
  }
}

/*
 * "Rule 1" of the unification RFC.
 *
 * See: https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md#module-type
 */
expectResolutions({
  message: 'Modules named main.',
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
    'router:main': `${modulePrefix}/src/router`
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
  message: 'resolving router:main returns null when module is not defined',
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
    [`${modulePrefix}/src/router`]: null
  },
  returns: {
    'router:main': undefined
  }
});

/*
 * "Rule 2" of the unification RFC.
 *
 * See: https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md#module-type
 */

expectResolutions({
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
    'service:i18n': `${modulePrefix}/src/services/i18n/service`
  }
});

/*
 * "Rule 2" of the unification RFC with a group.
 */

expectResolutions({
  message: 'rule 2 with a group',
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
    'helper:capitalize': `${modulePrefix}/src/ui/components/capitalize/helper`
  }
});

expectResolutions({
  message: 'rule 2 with a group and multiple types',
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
    [`${modulePrefix}/src/ui/components/capitalize/component`]: null
  },
  resolutions: {
    'component:capitalize': `${modulePrefix}/src/ui/components/capitalize`
  }
});

/*
 * "Rule 3" of the unification RFC. Rule 3 means a default type for a collection
 * is configured.
 */

expectResolutions({
  message: 'rule 3: resolving when a default type is configured',
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
    [`${modulePrefix}/src/services/i18n/service`]: null
  },
  resolutions: {
    'service:i18n': `${modulePrefix}/src/services/i18n`
  }
});

// Note: error format from require would be something like
// `Could not find module \`${modulePrefix}/src/services/i18n\` imported from \`(require)\`
expectResolutions({
  message: 'rule 3: throws when resolving a module name without type but a defaultType is not configured',
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
    [`${modulePrefix}/src/services/i18n`]: null,
    [`${modulePrefix}/src/services/i18n/service`]: null
  },
  returns: {
    'service:i18n': undefined
  }
});

expectResolutions({
  message: 'resolving with named "helper" export',
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
    [`${modulePrefix}/src/ui/components/capitalize/helper`]: null
  },
  resolutions: {
    'helper:capitalize': `${modulePrefix}/src/ui/components/capitalize:helper` // <-- if there's a ':', it means expect a named export (not "default")
  }
});

expectResolutions({
  message: 'resolving component:my-form/my-input to /ui/components/my-form/my-input',
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
    [`${modulePrefix}/src/ui/components/my-form/my-input/component`]: null
  },
  resolutions: {
    'component:my-form/my-input': `${modulePrefix}/src/ui/components/my-form/my-input`
  }
});

expectResolutions({
  message: 'resolving component:my-form/my-input to /ui/components/my-form/my-input/component',
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
    'component:my-form/my-input': `${modulePrefix}/src/ui/components/my-form/my-input/component`
  }
});

expectResolutions({
  message: 'resolving template:components/my-form/my-input to /ui/components/my-form/my-input/template',
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
  },
  moduleOverrides: {
    [`${modulePrefix}/src/ui/routes/my-form/my-input/template`]: null,
    [`${modulePrefix}/src/ui/routes/my-form/my-input`]: null,
    [`${modulePrefix}/src/ui/routes/my-form/-components/my-input/template`]: null,
    [`${modulePrefix}/src/ui/routes/my-form/-components/my-input`]: null

  },
  resolutions: {
    'template:components/my-form/my-input': `${modulePrefix}/src/ui/components/my-form/my-input/template`
  },
  returns: {
    'template:my-form/my-input': undefined,
    'template:my-form/-components/my-input': undefined
  }
});

expectResolutions({
  message: 'resolving template:my-form/my-input to /ui/routes/my-form/my-input/template',
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
  },
  moduleOverrides: {
    [`${modulePrefix}/src/ui/components/my-form/my-input/template`]: null,
    [`${modulePrefix}/src/ui/components/my-form/my-input`]: null
  },
  resolutions: {
    'template:my-form/my-input': `${modulePrefix}/src/ui/routes/my-form/my-input/template`
  },
  returns: {
    'template:components/my-form/my-input': undefined
  }
});

/**
 * Private Collections
 */

expectResolutions({
  message: 'resolving template:my-form/-components/my-input to /ui/routes/my-form/-components/my-input/template',
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
  },
  moduleOverrides: {
    [`${modulePrefix}/src/ui/components/my-form/my-input/template`]: null,
    [`${modulePrefix}/src/ui/components/my-form/my-input`]: null,
    [`${modulePrefix}/src/ui/routes/my-form/my-input/template`]: null,
    [`${modulePrefix}/src/ui/routes/my-form/my-input`]: null
  },
  resolutions: {
    'template:my-form/-components/my-input': `${modulePrefix}/src/ui/routes/my-form/-components/my-input/template`
  },
  returns: {
    'template:components/my-form/my-input': undefined,
    'template:my-form/my-input': undefined
  }
});

expectResolutions({
  message: 'failing to resolve component:my-form/my-input as /ui/components/my-form/-component/my-input',
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
  },
  moduleOverrides: {
    [`${modulePrefix}/src/ui/components/my-form/my-input/component`]: null,
    [`${modulePrefix}/src/ui/components/my-form/my-input`]: null,
    [`${modulePrefix}/src/ui/components/my-input/component`]: null,
    [`${modulePrefix}/src/ui/components/my-input`]: null
  },
  returns: {
    'component:my-form/my-input': undefined,
    'component:my-input': undefined
  }
});

expectResolutions({
  message: 'Unresolvable collections (utils)',
  config: {
    types: {
      service: { definitiveCollection: 'services' }
    },
    unresolvableCollections: {
      utils: true
    },
    collections: {
      services: {
        types: ['service']
      }
    }
  },
  moduleOverrides: {},
  errors: {
    'util:my-util': /"util" not a recognized type/,
    'service:services/-utils/my-service': /attempted to resolve a module in the unresolvable collection "utils"/
  }
});

/*
to do:
 * figure out the signature for instantiating the resolver -- what is it now, and where does the new config stuff go in?
 * the tests in resolver-test.js should be made to work simply by making the new resolver fallback to delegating to the old resolver
 *   ^^^ mixonic thinks this is incorrect. You should opt-in to the new resolver.
 *   Or perhaps only if you have a src dir?

 ember-cli/loader.js  open issue, public API for require/define    can import from loader instead of global requirejs https://github.com/ember-cli/loader.js/issues/82
 (bug) we don't fallback to index (like node does)
 "import has from loader"  ember-load-initializers could refactor https://github.com/ember-cli/ember-load-initializers/blob/master/addon/index.js
 */
