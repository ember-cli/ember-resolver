/* jshint node: true */
'use strict';

var VersionChecker = require('ember-cli-version-checker');

module.exports = {
  name: 'ember-resolver',

  init: function() {
    var checker = new VersionChecker(this);
    var dep = checker.for('ember-cli', 'npm');

    if (!dep.satisfies('>= 2.0.0')) {
      this.monkeyPatchVendorFiles();
    }
  },

  monkeyPatchVendorFiles: function() {
    var EmberApp = require('ember-cli/lib/broccoli/ember-app');
    var originalPopulateLegacyFiles = EmberApp.prototype.populateLegacyFiles;

    EmberApp.prototype.populateLegacyFiles = function () {
      delete this.vendorFiles['ember-resolver.js'];
      originalPopulateLegacyFiles.apply(this, arguments);
    };
  }
};
