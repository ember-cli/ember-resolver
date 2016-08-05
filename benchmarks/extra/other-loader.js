var registry = {}, seen = {};

module.exports.define = define;
function define(name, deps, callback) {
  var value = { };

  if (!callback) {
    value.deps = [];
    value.callback = deps;
  } else {
    value.deps = deps;
    value.callback = callback;
  }

  registry[name] = value;
}

module.exports.require = require;
function require(name) {
  return internalRequire(name, null);
}

require.has = function registryHas(moduleName) {
  return !!registry[moduleName] || !!registry[moduleName + '/index'];
};

function missingModule(name, referrerName) {
  if (referrerName) {
    throw new Error('Could not find module ' + name + ' required by: ' + referrerName);
  } else {
    throw new Error('Could not find module ' + name);
  }
}

function internalRequire(_name, referrerName) {
  var name = _name;
  var mod = registry[name];

  if (!mod) {
    name = name + '/index';
    mod = registry[name];
  }

  var exports = seen[name];

  if (exports !== undefined) {
    return exports;
  }

  exports = seen[name] = {};

  if (!mod) {
    missingModule(_name, referrerName);
  }

  var deps = mod.deps;
  var callback = mod.callback;
  var length = deps.length;
  var reified = new Array(length);

  for (var i = 0; i < length; i++) {
    if (deps[i] === 'exports') {
      reified[i] = exports;
    } else if (deps[i] === 'require') {
      reified[i] = require;
    } else {
      reified[i] = internalRequire(deps[i], name);
    }
  }

  callback.apply(this, reified);

  return exports;
}
