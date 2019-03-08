'use strict';

var writeFile = require('broccoli-file-creator');
var VersionChecker = require('ember-cli-version-checker');
var path = require('path');
var isModuleUnification;

function mergeRecursivelyAddonResolverConfig(config, addon) {

  if (!config.hasOwnProperty(addon.name)) {

    if (addon.resolverConfig) {
      config[addon.name] = addon.resolverConfig() || {};
    }

    addon.addons.forEach(nestedAddon => {
      mergeRecursivelyAddonResolverConfig(config, nestedAddon);
    });
  }

}

module.exports = {
  name: 'ember-resolver',

  emberResolverFeatureFlags() {
    var resolverConfig = {}; //TODO: load from ember-cli-build.js

    return Object.assign({
      /* Add default feature flags here, for now there is none */
    }, resolverConfig.features);
  },

  init: function() {
    this._super.init.apply(this, arguments);
    this.options = this.options || {};
    if (process.env.EMBER_CLI_MODULE_UNIFICATION) {
      this.project.isModuleUnification = function () {
        return true;
      }
    }
    this._emberResolverFeatureFlags = this.emberResolverFeatureFlags();
    isModuleUnification = !!this.project.isModuleUnification && this.project.isModuleUnification();

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

  treeForAddon: function() {
    var MergeTrees = require('broccoli-merge-trees');
    let addonTrees = [].concat(
      this._super.treeForAddon.apply(this, arguments),
      isModuleUnification && this._moduleUnificationTrees()
    ).filter(Boolean);

    return new MergeTrees(addonTrees);
  },

  // Trigger exception if the result of `addon.resolverConfig` method has an unexpected format
  // Show a warning if there are collisions between addon types or addon collections
  validateAddonsConfig: function(addonsConfig) {

    let types = {};
    let collections = {};

    Object.keys(addonsConfig).forEach(addonName => {

      let addonConfig = addonsConfig[addonName];
      if (addonConfig) {
        if (typeof(addonConfig) !== 'object') {
          throw new Error(`"addon.resolverConfig" returns an unexpected value. Addon: ${addonName}.`);
        }

        let addonTypes = addonConfig.types || {};
        if (typeof(addonTypes) !== 'object') {
          throw new Error(`"addon.resolverConfig" returns an unexpected "types" value. Addon: ${addonName}.`);
        }

        let addonCollections = addonConfig.collections || {};
        if (typeof(addonCollections) !== 'object') {
          throw new Error(`"addon.resolverConfig" returns an unexpected "collections" value. Addon: ${addonName}.`);
        }

        Object.keys(addonTypes).forEach(key => {
          if (!types.hasOwnProperty(key)) {
            types[key] = key;
          } else {
            this.ui.writeLine(`Addon '${types[key]}' configured the type '${key}' on the resolver, but addon '${addonName}' has overwritten the type '${key}'.`);
          }
        });
        Object.keys(addonCollections).forEach(key => {
          if (!collections.hasOwnProperty(key)) {
            collections[key] = key;
          } else {
            this.ui.writeLine(`Addon '${types[key]}' configured the collection '${key}' on the resolver, but addon '${addonName}' has overwritten the collection '${key}'.`);
          }
        });
      }
    });
  },

  _moduleUnificationTrees: function() {

    let addonConfigs = {};

    this.project.addons.forEach(addon => {
      mergeRecursivelyAddonResolverConfig(addonConfigs, addon);
    });
    this.validateAddonsConfig(addonConfigs);

    let addonConfigsFileContent = `export default ${JSON.stringify(addonConfigs)};`;

    var resolve = require('resolve');
    var Funnel = require('broccoli-funnel');

    let featureTreePath = path.join(this.root, 'mu-trees/addon');
    var featureTree = new Funnel(featureTreePath, {
      destDir: 'ember-resolver'
    });

    var addonsConfigTree = writeFile(
      'ember-resolver/addons-config.js',
      addonConfigsFileContent
    );

    var glimmerResolverSrc = require.resolve('@glimmer/resolver/package');
    var glimmerResolverPath = path.dirname(glimmerResolverSrc);
    var glimmerResolverTree = new Funnel(glimmerResolverPath, {
      srcDir: 'dist/modules/es2017',
      destDir: '@glimmer/resolver'
    });

    var glimmerDISrc = resolve.sync('@glimmer/di', { basedir: glimmerResolverPath });
    var glimmerDITree = new Funnel(path.join(glimmerDISrc, '../../../..'), {
      srcDir: 'dist/modules/es2017',
      destDir: '@glimmer/di'
    });

    return [
      this.preprocessJs(addonsConfigTree, { registry: this.registry }),
      this.preprocessJs(featureTree, { registry: this.registry }),
      this.preprocessJs(glimmerResolverTree, { registry: this.registry }),
      this.preprocessJs(glimmerDITree, { registry: this.registry }),
    ];
  },

  included: function() {
    this._super.included.apply(this, arguments);

    var checker = new VersionChecker(this);
    var dep = checker.for('ember-cli', 'npm');

    if (dep.lt('2.0.0')) {
      this.monkeyPatchVendorFiles();
    }
  },

  monkeyPatchVendorFiles: function() {
    var filesToAppend = this.app.legacyFilesToAppend;
    var legacyResolverIndex = filesToAppend.indexOf(this.app.bowerDirectory + '/ember-resolver/dist/modules/ember-resolver.js');

    if (legacyResolverIndex > -1) {
      filesToAppend.splice(legacyResolverIndex, 1);
    }
  }
};
