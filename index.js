/*jshint node:true*/
'use strict';

var VersionChecker = require('ember-cli-version-checker');
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');

var renameMap = {
  'src/main.js': 'app.js',
  'src/resolver.js': 'resolver.js',
  'src/ui/styles/app.css': 'styles/app.css',
  'src/ui/index.html': 'index.html'
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

  /**
   * Ember CLI treats 'templates' differently than the rest of app. Here
   * we tell it where our templates are.
   */
  treeForTemplates() {
    return new Funnel('src', {
      include: ['**/*.hbs'],
      destDir: 'src'
    });

    var appTree = new Funnel('app');
    var unifiedTree = new MergeTrees([appTree, srcTree]);

    return unifiedTree;
  },

  /**
   * Ember CLI puts all templates in a hard-coded 'templates' directory so
   * we have to move them.
   */
  postprocessTree(type, tree) {
    if (type === 'template') {
      return new Funnel(tree, {
        getDestinationPath: function getDestinationPath(relativePath) {
          return relativePath.replace('templates/src/', 'src/');
        }
      });
    }
    return tree;
  }
};
