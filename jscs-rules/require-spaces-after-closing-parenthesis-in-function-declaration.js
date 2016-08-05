/**
Copyright (c) 2015 Yehuda Katz, Tom Dale and Ember.js contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

taken from https://github.com/emberjs/ember.js
*/

var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {
  configure: function(options) {
    assert(
      typeof options === 'object',
      'requireSpacesAfterClosingParenthesisInFunctionDeclaration option must be the object'
    );

    assert(
      options.beforeOpeningCurlyBrace || options.beforeOpeningRoundBrace,
      'requireSpacesAfterClosingParenthesisInFunctionDeclaration must have beforeOpeningCurlyBrace or beforeOpeningRoundBrace property'
    );

    this._beforeOpeningRoundBrace = Boolean(options.beforeOpeningRoundBrace);
    this._beforeOpeningCurlyBrace = Boolean(options.beforeOpeningCurlyBrace);
  },

  getOptionName: function() {
    return 'requireSpacesAfterClosingParenthesisInFunctionDeclaration';
  },

  check: function(file, errors) {
    var beforeOpeningRoundBrace = this._beforeOpeningRoundBrace;
    var beforeOpeningCurlyBrace = this._beforeOpeningCurlyBrace;

    file.iterateNodesByType(['FunctionDeclaration'], function(node) {
      var functionToken = file.getFirstNodeToken(node.id || node);
      var nextToken = file.getNextToken(functionToken);

      if (beforeOpeningRoundBrace) {
        if (nextToken) {
          errors.add(
            'Missing space before opening round brace',
            nextToken.loc.start
          );
        }
      } else {
        if (!nextToken) {
          errors.add(
            'Illegal space before opening round brace',
            functionToken.loc.end
          );
        }
      }

      // errors if no token is found unless `includeComments` is passed
      var tokenBeforeBody = file.getPrevToken(node.body, { includeComments: true });

      if (beforeOpeningCurlyBrace) {
        if (tokenBeforeBody) {
          errors.add(
            'Missing space before opening curly brace',
            tokenBeforeBody.loc.start
          );
        }
      } else {
        if (!tokenBeforeBody) {
          errors.add(
            'Illegal space before opening curly brace',
            node.body.loc.end
          );
        }
      }
    });
  }
};
