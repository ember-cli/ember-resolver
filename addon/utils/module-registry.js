/*globals requirejs, require */

import Ember from 'ember';

if (typeof requirejs.entries === 'undefined') {
  requirejs.entries = requirejs._eak_seen;
}

function ModuleRegistry(entries) {
  this._entries = entries || requirejs.entries;
}

ModuleRegistry.prototype.moduleNames = function ModuleRegistry_moduleNames() {
  return (Object.keys || Ember.keys)(this._entries);
};

ModuleRegistry.prototype.has = function ModuleRegistry_has(moduleName) {
  return moduleName in this._entries;
};

ModuleRegistry.prototype.get = function ModuleRegistry_get(moduleName) {
  return require(moduleName);
};

ModuleRegistry.prototype.getExport = function ModuleRegistry_get_export(moduleName, exportName = 'default') {
  let module = require(moduleName);
  if (exportName) {
    return module && module[exportName];
  }

  return module;
};

export default ModuleRegistry;
