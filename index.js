'use strict';

const VersionChecker = require('ember-cli-version-checker');

module.exports = {
  name: require('./package.json').name,

  emberResolverFeatureFlags() {
    const resolverConfig = {}; //TODO: load from ember-cli-build.js

    return Object.assign({
      /* Add default feature flags here, for now there is none */
    }, resolverConfig.features);
  },

  init() {
    this._super.init.apply(this, arguments);
    this.options = this.options || {};
    if (process.env.EMBER_CLI_MODULE_UNIFICATION) {
      this.project.isModuleUnification = function () {
        return true;
      }
    }
    this._emberResolverFeatureFlags = this.emberResolverFeatureFlags();

    this.options.babel = {
      loose: true,
      plugins: [
        [require.resolve('babel-plugin-debug-macros'), {
          debugTools: {
            source: 'this-is-dumb-it-should-not-be-required-i-blame-rwjblue'
          },
          envFlags: {
            source: 'ember-resolver-env-flags',
            flags: { DEBUG: process.env.EMBER_ENV != 'production' }
          },
          features: {
            name: 'ember-resolver',
            source: 'ember-resolver/features',
            flags: this._emberResolverFeatureFlags
          }
        }]
      ]
    };
  },

  included() {
    this._super.included.apply(this, arguments);

    let checker = new VersionChecker(this);
    let dep = checker.for('ember-cli', 'npm');

    if (dep.lt('2.0.0')) {
      this.monkeyPatchVendorFiles();
    }
  },

  monkeyPatchVendorFiles() {
    let filesToAppend = this.app.legacyFilesToAppend;
    let legacyResolverIndex = filesToAppend.indexOf(this.app.bowerDirectory + '/ember-resolver/dist/modules/ember-resolver.js');

    if (legacyResolverIndex > -1) {
      filesToAppend.splice(legacyResolverIndex, 1);
    }
  }
};
