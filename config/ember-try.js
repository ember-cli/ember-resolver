'use strict';

const getChannelURL = require('ember-source-channel-url');

const EMBROIDER_VERSION = '^0.44.1';
const embroider = {
  safe: {
    name: 'embroider-safe',
    npm: {
      devDependencies: {
        '@embroider/core': EMBROIDER_VERSION,
        '@embroider/webpack': EMBROIDER_VERSION,
        '@embroider/compat': EMBROIDER_VERSION,
        '@embroider/test-setup': EMBROIDER_VERSION,

        // Webpack is a peer dependency of `@embroider/webpack`
        webpack: '^5.0.0',
      },
    },
    env: {
      EMBROIDER_TEST_SETUP_OPTIONS: 'safe',
    },
  },

  optimized: {
    name: 'embroider-optimized',
    npm: {
      devDependencies: {
        '@embroider/core': EMBROIDER_VERSION,
        '@embroider/webpack': EMBROIDER_VERSION,
        '@embroider/compat': EMBROIDER_VERSION,
        '@embroider/test-setup': EMBROIDER_VERSION,

        // Webpack is a peer dependency of `@embroider/webpack`
        webpack: '^5.0.0',
      },
    },
    env: {
      EMBROIDER_TEST_SETUP_OPTIONS: 'optimized',
    },
  },
};


module.exports = async function() {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-lts-3.8',
        npm: {
          devDependencies: {
            'ember-source': '~3.8.0'
          }
        }
      },
      {
        name: 'ember-lts-3.12',
        npm: {
          devDependencies: {
            'ember-source': '~3.12.0'
          }
        }
      },
      {
        name: 'ember-lts-3.16',
        npm: {
          devDependencies: {
            'ember-source': '~3.16.0'
          }
        }
      },
      {
        name: 'ember-lts-3.16',
        npm: {
          devDependencies: {
            'ember-source': '~3.16.0'
          }
        }
      },
      {
        name: 'ember-lts-3.20',
        npm: {
          devDependencies: {
            'ember-source': '~3.20.0'
          }
        }
      },
      {
        name: 'ember-lts-3.24',
        npm: {
          devDependencies: {
            'ember-source': '~3.24.0'
          }
        }
      },
      {
        name: 'ember-lts-3.28',
        npm: {
          devDependencies: {
            'ember-source': '~3.28.0'
          }
        }
      },
      {
        name: 'ember-lts-4.4',
        npm: {
          devDependencies: {
            'ember-source': '~4.4.0'
          }
        }
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release')
          }
        }
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('beta')
          }
        }
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary')
          }
        }
      },
      // The default `.travis.yml` runs this scenario via `yarn test`,
      // not via `ember try`. It's still included here so that running
      // `ember try:each` manually or from a customized CI config will run it
      // along with all the other scenarios.
      {
        name: 'ember-default',
        npm: {
          devDependencies: {}
        }
      },
      embroider.safe,
      embroider.optimized,
    ]
  };
};
