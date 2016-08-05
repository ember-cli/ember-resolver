var loader = require('../../lib/loader/loader.js');
var measure = require('../handler').measure;

module.exports = function() {
  return measure(function() {
    loader.define('foo' + -1, function() {});
    for (var i = 0; i < 1000; i++) {
      loader.define('foo' + i, ['foo' + (i - 1)], function() {});
    }

    loader.require('foo' + (i - 1));
  });
};
