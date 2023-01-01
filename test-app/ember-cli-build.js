'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    // Add options here
  });

  try {
    const { maybeEmbroider } = require('@embroider/test-setup');
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
