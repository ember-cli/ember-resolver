/*globals ENV QUnit EmberDev */

var define, registry = {};

(function() {
  window.Ember = {
    testing: true
  };
  window.ENV = window.ENV || {};

  // Test for "hooks in ENV.EMBER_LOAD_HOOKS['hookName'] get executed"
  ENV.EMBER_LOAD_HOOKS = ENV.EMBER_LOAD_HOOKS || {};
  ENV.EMBER_LOAD_HOOKS.__before_ember_test_hook__ = ENV.EMBER_LOAD_HOOKS.__before_ember_test_hook__ || [];
  ENV.__test_hook_count__ = 0;
  ENV.EMBER_LOAD_HOOKS.__before_ember_test_hook__.push(function(object) {
    ENV.__test_hook_count__ += object;
  });

  // Handle extending prototypes
  QUnit.config.urlConfig.push('extendprototypes');

  // var extendPrototypes = QUnit.urlParams.extendprototypes;
  // ENV['EXTEND_PROTOTYPES'] = !!extendPrototypes;

  // Don't worry about jQuery version
  ENV['FORCE_JQUERY'] = true;

  if (EmberDev.jsHint) {
    // jsHint makes its own Object.create stub, we don't want to use this
    ENV['STUB_OBJECT_CREATE'] = !Object.create;
  }

  EmberDev.distros = {
    spade:   'ember-resolver-spade.js',
    build:   'ember-resolver.js'
  };

  // super simple define hack
  var hasOwn = Object.prototype.hasOwnProperty;

  function hasProp(obj, prop) {
    return hasOwn.call(obj, prop);
  }

  define = function (name, deps, callback) {

    //This module may not have dependencies
    if (!deps.splice) {
      //deps is not an array, so probably means
      //an object literal or factory function for
      //the value. Adjust args.
      callback = deps;
      deps = [];
    }

    if (!hasProp(registry, name)) {
      registry[name] = [name, deps, callback];
    }
  };
})();
