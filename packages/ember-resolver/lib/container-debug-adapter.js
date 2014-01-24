/*globals define registry requirejs */

define("container-debug-adapter",
  [],
  function() {
    "use strict";
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
          // TODO

          module = require(key, null, null, true);

          if (module && module['default']) { module = module['default']; }
          module.shortname = key.split(type +'s/').pop();
          module.shortname = key.split(type +'s/').pop();
          module.shortname = key.split(type +'s/').pop();
          // var modelClass = this.container.lookupFactory("model:" + modelname);
          module.toString = makeToString;

          types.push(module); 
        }
      }
 
      return types;
    }
  });

  ContainerDebugAdapter['default'] = ContainerDebugAdapter;
  return ContainerDebugAdapter;
});

/*

  1. Test to find this class
  2. Test to Access the methods
  3. Verify this build includes this / makes available
  4. Add an Initializer to register this

*/


    // var moduleName, tmpModuleName, prefix, podPrefix, moduleRegistry;

    // prefix = this.namespace.modulePrefix;
    // podPrefix = this.namespace.podModulePrefix || prefix;
    // moduleRegistry = requirejs._eak_seen;

    // Ember.assert('module prefix must be defined', prefix);

    // var pluralizedType = parsedName.type + 's';
    // var name = parsedName.fullNameWithoutType;

    // // lookup using POD formatting first
    // tmpModuleName = podPrefix + '/' + name + '/' + parsedName.type;
    // if (moduleRegistry[tmpModuleName]) {
    //   moduleName = tmpModuleName;
    // }

    // // if not using POD format, use the custom prefix
    // if (this.namespace[parsedName.type + 'Prefix']) {
    //   prefix = this.namespace[parsedName.type + 'Prefix'];
    // }

    // // if router:main or adapter:main look for a module with just the type first
    // tmpModuleName = prefix + '/' + parsedName.type;
    // if (!moduleName && name === 'main' && moduleRegistry[tmpModuleName]) {
    //   moduleName = prefix + '/' + parsedName.type;
    // }

    // // fallback if not type:main or POD format
    // if (!moduleName) { moduleName = prefix + '/' +  pluralizedType + '/' + name; }

    // // allow treat all dashed and all underscored as the same thing
    // // supports components with dashes and other stuff with underscores.
    // var normalizedModuleName = chooseModuleName(moduleRegistry, moduleName);

    // if (moduleRegistry[normalizedModuleName]) {
    //   var module = require(normalizedModuleName, null, null, true );/* force sync */

  //     if (module && module['default']) { module = module['default']; }

  //     if (module === undefined) {
  //       throw new Error(" Expected to find: '" + parsedName.fullName + "' within '" + normalizedModuleName + "' but got 'undefined'. Did you forget to `export default` within '" + normalizedModuleName + "'?");
  //     }

  //     if (this.shouldWrapInClassFactory(module, parsedName)) {
  //       module = classFactory(module);
  //     }

  //     logLookup(true, parsedName, moduleName);

  //     return module;
  // }


