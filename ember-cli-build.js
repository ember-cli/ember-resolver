/* eslint-env node */
'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

module.exports = function(defaults) {
  let testTrees = [new Funnel('tests', {
    exclude: [/^dummy/],
  })];

  let config = defaults.project.config();
  let resolverConfig = config['ember-resolver'] || {};

  if (resolverConfig.features.EMBER_RESOLVER_MODULE_UNIFICATION) {
    testTrees.push('mu-trees/tests');
  }

  let app = new EmberAddon(defaults, {
    trees: {
      tests: new MergeTrees(testTrees)
    },

    // Add options here
    vendorFiles: {
      'ember-resolver.js': null
    }
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  return app.toTree();
};
