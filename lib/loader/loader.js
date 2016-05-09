var loader, define, requireModule, require, requirejs;

(function(global) {
  'use strict';

  // Save off the original values of these globals, so we can restore them if someone asks us to
  var oldGlobals = {
    loader: loader,
    define: define,
    requireModule: requireModule,
    require: require,
    requirejs: requirejs
  };

  requirejs = require = requireModule = function(name) {
    stats.require++;
    return findModule(name, '(require)').module.exports;
  };

  function resetStats() {
    stats = {
      define: 0,
      require: 0,
      reify: 0,
      build: 0,
      modules: 0,
      exports: 0,
      ensureBuild: 0,
      resolve: 0,
      resolveRelative: 0,
      findModule: 0,
    };
    requirejs._stats = stats;
  }

  var stats;
  resetStats();

  loader = {
    noConflict: function(aliases) {
      var oldName, newName;

      for (oldName in aliases) {
        if (aliases.hasOwnProperty(oldName)) {
          if (oldGlobals.hasOwnProperty(oldName)) {
            newName = aliases[oldName];

            global[newName] = global[oldName];
            global[oldName] = oldGlobals[oldName];
          }
        }
      }
    }
  };

  var _isArray;
  if (!Array.isArray) {
    _isArray = function (x) {
      return Object.prototype.toString.call(x) === '[object Array]';
    };
  } else {
    _isArray = Array.isArray;
  }

  var registry = {};
  var seen = {};
  var FAILED = false;
  var LOADED = true;

  var uuid = 0;

  function unsupportedModule(length) {
    throw new Error('an unsupported module was defined, expected `define(name, deps, module)` instead got: `' +
                    length + '` arguments to define`');
  }

  var defaultDeps = ['require', 'exports', 'module'];

  function Module(name, deps, callback, alias) {
    stats.modules ++;
    this.id        = uuid++;
    this.name      = name;
    this.deps      = !deps.length && callback.length ? defaultDeps : deps;
    this.module    = { exports: {} };
    this.callback  = callback;
    this.state     = undefined;
    this.finalized = false;
    this.hasExportsAsDep = false;
    this.isAlias = alias;
    this.reified = new Array(deps.length);
  }

  Module.prototype.makeDefaultExport = function() {
    var exports = this.module.exports;
    if (exports !== null &&
        (typeof exports === 'object' || typeof exports === 'function') &&
          exports['default'] === undefined) {
      exports['default'] = exports;
    }
  };

  Module.prototype.exports = function() {
    stats.exports ++;
    if (this.finalized) {
      return this.module.exports;
    } else {
      if (loader.wrapModules) {
        this.callback = loader.wrapModules(this.name, this.callback);
      }
      var result = this.callback.apply(this, this.reified);
      if (!(this.hasExportsAsDep && result === undefined)) {
        this.module.exports = result;
      }
      this.makeDefaultExport();
      this.finalized = true;
      return this.module.exports;
    }
  };

  Module.prototype.unsee = function() {
    this.finalized = false;
    this.state = undefined;
    this.module = { exports: {}};
  };

  Module.prototype.reify = function() {
    stats.reify++;
    var deps = this.deps;
    var dep;
    var reified = this.reified;

    for (var i = 0; i < deps.length; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        this.hasExportsAsDep = true;
        reified[i] = this.module.exports;
      } else if (dep === 'require') {
        reified[i] = this.makeRequire();
      } else if (dep === 'module') {
        reified[i] = this.module;
      } else {
        reified[i] = findModule(resolve(dep, this.name), this.name).module.exports;
      }
    }
  };

  Module.prototype.makeRequire = function() {
    var name = this.name;
    var r = function(dep) {
      return require(resolve(dep, name));
    };
    r['default'] = r;
    r.has = function(dep) {
      return has(resolve(dep, name));
    }
    return r;
  };

  Module.prototype.build = function() {
    stats.ensureBuild++;
    if (this.state === FAILED || this.state === LOADED) { return; }
    stats.build++;
    this.state = FAILED;
    this.reify()
    this.exports();
    this.state = LOADED;
  };

  define = function(name, deps, callback) {
    stats.define++;
    if (arguments.length < 2) {
      unsupportedModule(arguments.length);
    }

    if (!_isArray(deps)) {
      callback = deps;
      deps     =  [];
    }

    if (callback instanceof Alias) {
      registry[name] = new Module(callback.name, deps, callback, true);
    } else {
      registry[name] = new Module(name, deps, callback, false);
    }
  };

  // we don't support all of AMD
  // define.amd = {};
  // we will support petals...
  define.petal = { };

  function Alias(path) {
    this.name = path;
  }

  define.alias = function(path) {
    return new Alias(path);
  };

  function missingModule(name, referrer) {
    throw new Error('Could not find module `' + name + '` imported from `' + referrer + '`');
  }

  function findModule(name, referrer) {
    stats.findModule++;
    var mod = registry[name] || registry[name + '/index'];

    while (mod && mod.isAlias) {
      mod = registry[mod.name];
    }

    if (!mod) { missingModule(name, referrer); }

    mod.build();
    return mod;
  }

  function resolve(child, name) {
    stats.resolve++;
    if (child.charAt(0) !== '.') { return child; }
    stats.resolveRelative++;

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase = nameParts.slice(0, -1);

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') {
        if (parentBase.length === 0) {
          throw new Error('Cannot access parent module of root');
        }
        parentBase.pop();
      } else if (part === '.') {
        continue;
      } else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  function has(name) {
    return !!(registry[name] || registry[name + '/index']);
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.has = has;
  requirejs.unsee = function(moduleName) {
    findModule(moduleName, '(unsee)').unsee();
  };

  requirejs.clear = function() {
    resetStats();
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = {};
  };

  // prime
  define('foo',      function() {});
  define('foo/bar',  [], function() {});
  define('foo/asdf', ['module', 'exports', 'require'], function(module, exports, require) {
    if (require.has('foo/bar')) {
      require('foo/bar');
    }
  });
  define('foo/baz',  [], define.alias('foo'));
  define('foo/quz',  define.alias('foo'));
  define('foo/bar',  ['foo', './quz', './baz', './asdf', './bar', '../foo'], function() {});
  define('foo/main', ['foo/bar'], function() {});

  require('foo/main');
  require.unsee('foo/bar');

  requirejs.clear();

  if (typeof exports === 'object' && typeof module === 'object' && module.exports) {
    module.exports = { require: require, define: define };
  }
})(this);
