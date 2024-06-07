import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { setupResolver, resolver, loader } from './-setup-resolver';

let originalConsoleInfo, logCalls;

module('Logging', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    originalConsoleInfo = console ? console.info : null;
    logCalls = [];
    console.info = function (arg) {
      logCalls.push(arg);
    };
    setupResolver({ owner: this.owner });
  });

  hooks.afterEach(function () {
    if (originalConsoleInfo) {
      console.info = originalConsoleInfo;
    }
  });

  test('logs lookups when logging is enabled', function (assert) {
    loader.define('appkit/fruits/orange', [], function () {
      return 'is logged';
    });

    let env = this.owner.resolveRegistration('config:environment');
    env.LOG_MODULE_RESOLVER = true;

    resolver.resolve('fruit:orange');

    assert.ok(logCalls.length, 'should log lookup');
  });

  test("doesn't log lookups if disabled", function (assert) {
    loader.define('appkit/fruits/orange', [], function () {
      return 'is not logged';
    });

    let env = this.owner.resolveRegistration('config:environment');
    env.LOG_MODULE_RESOLVER = false;

    resolver.resolve('fruit:orange');

    assert.equal(logCalls.length, 0, 'should not log lookup');
  });
});
