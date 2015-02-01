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
     * Get all defined modules.
     *
     * @method _getEntries
     * @return {Array} the list of registered modules.
     * @private
     */
    _getEntries: function() {
      return requirejs.entries;
    },

    /**
      Returns the available classes a given type.

      @method catalogEntriesByType
      @param {string} type The type. e.g. "model", "controller", "route"
      @return {Array} An array of classes.
    */
    catalogEntriesByType: function(type) {
      var entries = this._getEntries(),
          module,
          types = Ember.A();

      var makeToString = function(){
        return this.shortname;
      };

      var prefix = this.namespace.modulePrefix;

      for(var key in entries) {
        if(entries.hasOwnProperty(key) && key.indexOf(type) !== -1) {
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

  function getPod(type, key, prefix) {
    var match = key.match(new RegExp('^/?' + prefix + '/(.+)/' + type + '$'));
    if (match) {
      return match[1];
    }
  }

  ContainerDebugAdapter['default'] = ContainerDebugAdapter;
  return ContainerDebugAdapter;
});
