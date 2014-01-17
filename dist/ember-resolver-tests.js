// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: Copyright 2013 Stefan Penner and Ember App Kit Contributors
// License:   Licensed under MIT license
//            See https://raw.github.com/stefanpenner/ember-jj-abrams-resolver/master/LICENSE
// ==========================================================================


 // Version: 0.0.1

var JSHINTRC = {
    "predef": [
        "console",
        "Ember",
        "DS",
        "Handlebars",
        "Metamorph",
        "ember_assert",
        "ember_warn",
        "ember_deprecate",
        "ember_deprecateFunc",
        "require",
        "equal",
        "asyncTest",
        "test",
        "raises",
        "deepEqual",
        "start",
        "stop",
        "ok",
        "strictEqual",
        "module",
        "expect",
        "minispade",
        "async",
        "invokeAsync"
    ],

    "node" : false,
    "es5" : true,
    "browser" : true,

    "boss" : true,
    "curly": false,
    "debug": false,
    "devel": false,
    "eqeqeq": true,
    "evil": true,
    "forin": false,
    "immed": false,
    "laxbreak": false,
    "newcap": true,
    "noarg": true,
    "noempty": false,
    "nonew": false,
    "nomen": false,
    "onevar": false,
    "plusplus": false,
    "regexp": false,
    "undef": true,
    "sub": true,
    "strict": false,
    "white": false
}
;

minispade.register('ember-resolver/~tests/core_test', "(function() {/*globals define registry requirejs */\n\nvar Resolver, resolver;\n\nfunction resetRegistry() {\n  var keeper = requirejs._eak_seen['resolver'];\n\n  requirejs.clear();\n  define('resolver', keeper['deps'], keeper['callback']);\n}\n\nfunction setupResolver(options) {\n  if (!options) {\n    options = { namespace: { modulePrefix: 'appkit' } };\n  }\n\n  Resolver = require('resolver')['default'];\n  resolver = Resolver.create(options);\n}\n\nmodule(\"Resolver Tests\",{\n  setup: function(){\n    setupResolver();\n  },\n\n  teardown: resetRegistry\n});\n\ntest(\"can access Resolver\", function(){\n  ok(resolver);\n});\n\ntest(\"can lookup something\", function(){\n  expect(2);\n\n  define('appkit/adapters/post', [], function(){\n    ok(true, \"adapter was invoked properly\");\n\n    return Ember.K;\n  });\n\n  var adapter = resolver.resolve('adapter:post');\n\n  ok(adapter, 'adapter was returned');\n\n  adapter();\n});\n\ntest(\"will return the raw value if no 'default' is available\", function() {\n  define('appkit/fruits/orange', [], function(){\n    return 'is awesome';\n  });\n\n  equal(resolver.resolve('fruit:orange'), 'is awesome', 'adapter was returned');\n});\n\ntest(\"will unwrap the 'default' export automatically\", function(){\n  define('appkit/fruits/orange', [], function(){\n    return {default: 'is awesome'};\n  });\n\n  equal(resolver.resolve('fruit:orange'), 'is awesome', 'adapter was returned');\n});\n\ntest(\"router:main is hard-coded to prefix/router.js\", function() {\n  expect(1);\n\n  define('appkit/router', [], function(){\n    ok(true, 'router:main was looked up');\n    return 'whatever';\n  });\n\n  resolver.resolve('router:main');\n});\n\ntest(\"will raise error if both dasherized and underscored modules exist\", function() {\n  define('appkit/big-bands/steve-miller-band', [], function(){\n    ok(true, 'dasherized version looked up');\n    return 'whatever';\n  });\n\n  define('appkit/big_bands/steve_miller_band', [], function(){\n    ok(false, 'underscored version looked up');\n    return 'whatever';\n  });\n\n  try {\n    resolver.resolve('big-band:steve-miller-band');\n  } catch (e) {\n    equal(e.message, 'Ambiguous module names: `appkit/big-bands/steve-miller-band` and `appkit/big_bands/steve_miller_band`', \"error with a descriptive value is thrown\");\n  }\n});\n\ntest(\"will lookup an underscored version of the module name when the dasherized version is not found\", function() {\n  expect(1);\n\n  define('appkit/big_bands/steve_miller_band', [], function(){\n    ok(true, 'underscored version looked up properly');\n    return 'whatever';\n  });\n\n  resolver.resolve('big-band:steve-miller-band');\n});\n\n})();\n//@ sourceURL=ember-resolver/~tests/core_test");