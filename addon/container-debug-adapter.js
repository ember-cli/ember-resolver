import Ember from 'ember';
import ModuleRegistry from './utils/module-registry';

let { ContainerDebugAdapter } = Ember;

let ModulesContainerDebugAdapter = null;

function getPod(type, key, prefix) {
  var match = key.match(new RegExp('^/?' + prefix + '/(.+)/' + type + '$'));
  if (match) {
    return match[1];
  }
}

// Support Ember < 1.5-beta.4
// TODO: Remove this after 1.5.0 is released
if (typeof ContainerDebugAdapter !== 'undefined') {

  /*
   * This module defines a subclass of Ember.ContainerDebugAdapter that adds two
   * important features:
   *
   *  1) is able provide injections to classes that implement `extend`
   *     (as is typical with Ember).
   */

  ModulesContainerDebugAdapter = ContainerDebugAdapter.extend({
    _moduleRegistry: null,

    init() {
      this._super(...arguments);

      if (!this._moduleRegistry) {
        this._moduleRegistry = new ModuleRegistry();
      }
    },

    /**
      The container of the application being debugged.
      This property will be injected
      on creation.

      @property container
      @default null
    */

    /**
      The resolver instance of the application
      being debugged. This property will be injected
      on creation.

      @property resolver
      @default null
    */

    /**
      Returns true if it is possible to catalog a list of available
      classes in the resolver for a given type.

      @method canCatalogEntriesByType
      @param {string} type The type. e.g. "model", "controller", "route"
      @return {boolean} whether a list is available for this type.
    */
    canCatalogEntriesByType: function(/* type */) {
      return true;
    },

    /**
      Returns the available classes a given type.

      @method catalogEntriesByType
      @param {string} type The type. e.g. "model", "controller", "route"
      @return {Array} An array of classes.
    */
    catalogEntriesByType: function(type) {
      let moduleNames = this._moduleRegistry.moduleNames();
      let types = Ember.A();

      var prefix = this.namespace.modulePrefix;

      for (let i = 0, l = moduleNames.length; i < l; i++) {
        let key = moduleNames[i];

        if(key.indexOf(type) !== -1) {
          // Check if it's a pod module
          var name = getPod(type, key, this.namespace.podModulePrefix || prefix);
          if (!name) {
            // Not pod
            name = key.split(type + 's/').pop();

            // Support for different prefix (such as ember-cli addons).
            // Uncomment the code below when
            // https://github.com/ember-cli/ember-resolver/pull/80 is merged.

            //var match = key.match('^/?(.+)/' + type);
            //if (match && match[1] !== prefix) {
              // Different prefix such as an addon
              //name = match[1] + '@' + name;
            //}
          }
          types.addObject(name);
        }
      }
      return types;
    }
  });
}

export default ModulesContainerDebugAdapter;
