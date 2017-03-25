/* jshint node: true */
'use strict';

var VersionChecker = require('ember-cli-version-checker');

module.exports = {
  name: 'ember-resolver',

  init: function() {
    this._super.init.apply(this, arguments);
    this.options = this.options || {};

    var config = this.project.config();
    var resolverConfig = config['ember-resolver'] || {};

    var resolverFeatureFlags = Object.assign({
      /* Add default feature flags here */
    }, resolverConfig.features);

    this.options.babel = {
      loose: true,
      plugins: [
        [require('babel-plugin-debug-macros').default, {
          debugTools: {
            source: '@ember/debug'
          },
          envFlags: {
            source: 'ember-resolver-env-flags',
            flags: { DEBUG: process.env.EMBER_ENV != 'production' }
          },
          features: {
            name: 'ember-resolver',
            source: 'ember-resolver/features',
            flags: resolverFeatureFlags
          }
        }]
      ]
    };
  },

  included: function() {
    this._super.included.apply(this, arguments);

    var checker = new VersionChecker(this);
    var dep = checker.for('ember-cli', 'npm');

    if (dep.lt('2.0.0')) {
      this.monkeyPatchVendorFiles();
    }

    this.app.import('vendor/ember-resolver/legacy-shims.js');
  },

  monkeyPatchVendorFiles: function() {
    var filesToAppend = this.app.legacyFilesToAppend;
    var legacyResolverIndex = filesToAppend.indexOf(this.app.bowerDirectory + '/ember-resolver/dist/modules/ember-resolver.js');

    if (legacyResolverIndex > -1) {
      filesToAppend.splice(legacyResolverIndex, 1);
    }
  }
};
