'use strict';

module.exports = {
  name: 'loader.js',

  init: function() {
    this._super.init && this._super.init.apply(this, arguments);

    this.treePaths['vendor'] = 'lib';
  },

  included: function() {
    this.app.import('vendor/loader/loader.js', {
      prepend: true
    });
  }
};
