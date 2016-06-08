/*globals requirejs, require */

import Ember from 'ember';

if (typeof requirejs.entries === 'undefined') {
  requirejs.entries = requirejs._eak_seen;
}

function ModuleRegistry(entries) {
  this._entries = requirejs.entries;
  this._stringRegistry = requirejs.stringRegistry;
}

ModuleRegistry.prototype.moduleNames = function ModuleRegistry_moduleNames() {
  return requirejs.moduleNames();
};

ModuleRegistry.prototype.has = function ModuleRegistry_has(moduleName) {
  return requirejs.has(moduleName);
};

ModuleRegistry.prototype.get = function ModuleRegistry_get(moduleName, exportName = 'default') {
  let module = require(moduleName);
  return module && module[exportName];
};

export default ModuleRegistry;
