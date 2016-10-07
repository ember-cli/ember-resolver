import { module, test } from 'qunit';
import Resolver from 'ember-resolver/unified-resolver';

let modulePrefix = 'test-namespace';

module('ember-resolver/unified-resolver #normalize', {});

test('normalize components/my-input', function(assert) {
  let resolver = Resolver.create({
    namespace: {modulePrefix}
  });
  assert.equal(resolver.normalize('component:my-input'), 'component:my-input', 'normalize preserves dasherization for component:my-input');
});

test('normalize route:my-input', function(assert) {
  let resolver = Resolver.create({
    namespace: {modulePrefix}
  });
  assert.equal(resolver.normalize('route:my-input'), 'route:my-input', 'normalize preserves dasherization for route:my-input');
})
