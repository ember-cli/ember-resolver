/* jshint node: true */
'use strict';

var VersionChecker = require('ember-cli-version-checker');
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees')

var renameMap = {
  'src/main.js': 'app.js',
  'src/resolver.js': 'resolver.js',
  'src/ui/styles/app.css': 'styles/app.css' // Need a glob strategy
};

module.exports = {
  name: 'dangerously-set-unified-resolver',

  isDevelopingAddon: function() {
    return true
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

  treeForApp() {
    var srcTree = new Funnel('src', {
      destDir: 'src'
    });

    var appTree = new Funnel('app');

    var unifiedTree = new MergeTrees([appTree, srcTree]);

    var withAppCompatibility = new Funnel(unifiedTree, {
      getDestinationPath: function getDestinationPath(relativePath) {
        return renameMap[relativePath] || relativePath;
      }
    });

    return withAppCompatibility;
  },

  monkeyPatchVendorFiles: function() {
    var filesToAppend = this.app.legacyFilesToAppend;
    var legacyResolverIndex = filesToAppend.indexOf(this.app.bowerDirectory + '/ember-resolver/dist/modules/ember-resolver.js');

    if (legacyResolverIndex > -1) {
      filesToAppend.splice(legacyResolverIndex, 1);
    }
  }
};
