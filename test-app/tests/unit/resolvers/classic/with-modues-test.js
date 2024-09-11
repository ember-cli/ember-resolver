/* eslint-disable no-console */

import { module, test } from 'qunit';
import Resolver from 'ember-resolver';

module('ember-resolver withModules', function () {
  test('explicit withModules', function (assert) {
    let resolver = Resolver.withModules({
      'alpha/components/hello': {
        default: function () {
          return 'it works';
        },
      },
    }).create({ namespace: { modulePrefix: 'alpha' } });

    assert.strictEqual((0, resolver.resolve('component:hello'))(), 'it works');
  });
});
