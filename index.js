/* jshint node: true */
'use strict';

var VersionChecker = require('ember-cli-version-checker');
var path = require('path');
var mergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-resolver',

  included: function() {
    this._super.included.apply(this, arguments);

    var checker = new VersionChecker(this);
    var dep = checker.for('ember-cli', 'npm');

    if (dep.lt('2.0.0')) {
      this.monkeyPatchVendorFiles();
    }

    this.app.import('vendor/ember-resolver/legacy-shims.js');
  },

  treeForApp: function(defaultTree) {
    var checker = new VersionChecker(this);
    var emberVersion = checker.for('ember', 'bower');

    if (emberVersion.satisfies('<= 1.13')) {
      var trees = [defaultTree];
      trees.push(this.treeGenerator(path.resolve(this.root, 'app-lt-2-0')));
      return mergeTrees(trees, { overwrite: true });
    }

    return defaultTree;
  },

  monkeyPatchVendorFiles: function() {
    var filesToAppend = this.app.legacyFilesToAppend;
    var legacyResolverIndex = filesToAppend.indexOf(this.app.bowerDirectory + '/ember-resolver/dist/modules/ember-resolver.js');

    if (legacyResolverIndex > -1) {
      filesToAppend.splice(legacyResolverIndex, 1);
    }
  }
};
