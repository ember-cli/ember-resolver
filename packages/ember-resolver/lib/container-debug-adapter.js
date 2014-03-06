/*globals define registry requirejs */

define("ember/container-debug-adapter",
  [],
  function() {
    "use strict";

  // Support Ember < 1.5-beta.4
  // TODO: Remove this after 1.5.0 is released
  if (typeof Ember.ContainerDebugAdapter === 'undefined') {
    return null;
  }
  /*
   * This module defines a subclass of Ember.ContainerDebugAdapter that adds two
   * important features:
   *
   *  1) is able provide injections to classes that implement `extend`
   *     (as is typical with Ember).
   */

  var ContainerDebugAdapter = Ember.ContainerDebugAdapter.extend({
    /**
      The container of the application being debugged.
      This property will be injected
      on creation.

      @property container
      @default null
    */
    // container: null, LIVES IN PARENT

    /**
      The resolver instance of the application
      being debugged. This property will be injected
      on creation.

      @property resolver
      @default null
    */
    // resolver: null,  LIVES IN PARENT
    /**
      Returns true if it is possible to catalog a list of available
      classes in the resolver for a given type.

      @method canCatalogEntriesByType
      @param {string} type The type. e.g. "model", "controller", "route"
      @return {boolean} whether a list is available for this type.
    */
    canCatalogEntriesByType: function(type) {
      return true;
    },

    /**
      Returns the available classes a given type.

      @method catalogEntriesByType
      @param {string} type The type. e.g. "model", "controller", "route"
      @return {Array} An array of classes.
    */
    catalogEntriesByType: function(type) {
      var entries = requirejs.entries,
          module,
          types = Ember.A();

      var makeToString = function(){
        return this.shortname;
      };

      for(var key in entries) {
        if(entries.hasOwnProperty(key) && key.indexOf(type) !== -1)
        {
          // // TODO return the name instead of the module itself
          // module = require(key, null, null, true);

          // if (module && module['default']) { module = module['default']; }
          // module.shortname = key.split(type +'s/').pop();
          // module.toString = makeToString;

          // types.push(module);
          types.push(key.split(type +'s/').pop());
        }
      }

      return types;
    }
  });

  ContainerDebugAdapter['default'] = ContainerDebugAdapter;
  return ContainerDebugAdapter;
});
