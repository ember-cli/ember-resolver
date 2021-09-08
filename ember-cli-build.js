'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

module.exports = function(defaults) {
  let testTrees = [new Funnel('tests', {
    exclude: [/^dummy/],
  })];

  let isModuleUnification = !!defaults.project.isModuleUnification &&
    defaults.project.isModuleUnification();

  if (isModuleUnification) {
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

  try {
    const { maybeEmbroider } = require('@embroider/test-setup'); // eslint-disable-line node/no-missing-require
    return maybeEmbroider(app);
  } catch (e) {
    // This exists, so that we can continue to support node 10 for some of our
    // test scenarios. Specifically those not scenario testing embroider. As
    // @embroider/test-setup and @embroider in no longer supports node 10
    if (e !== null && typeof e === 'object' && e.code === 'MODULE_NOT_FOUND') {
      return app.toTree();
    }
    throw e;
  }
};
