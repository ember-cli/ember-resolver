import { module, test } from 'qunit';
import ClassicResolver from 'ember-resolver/resolvers/classic';
import DefaultResolver from 'ember-resolver/resolver';
import Resolver from 'ember-resolver/resolver';

module('ember-resolver/resolver');

test('classic resolver is the default export', function (assert) {
  assert.equal(
    ClassicResolver,
    Resolver,
    'ember-resolver/resolvers/classic and ember-resolver/resolver are the same'
  );
});

module('ember-resolver');

test('classic resolver is the default export', function (assert) {
  assert.equal(
    ClassicResolver,
    DefaultResolver,
    'ember-resolver/resolvers/classic and ember-resolver are the same'
  );
});
