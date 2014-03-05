/*globals define registry requirejs */

define("ember/resolver",
  [],
  function() {
    "use strict";

    // Support Ember < 1.5-beta.4
    // TODO: Remove this after 1.5.0 is released
    if (typeof Ember.Resolver === 'undefined') {
      Ember.Resolver = Ember.DefaultResolver;
    }
    if (typeof requirejs.entries === 'undefined') {
      requirejs.entries = requirejs._eak_seen;
    }

  /*
   * This module defines a subclass of Ember.DefaultResolver that adds two
   * important features:
   *
   *  1) The resolver makes the container aware of es6 modules via the AMD
   *     output. The loader's _moduleEntries is consulted so that classes can be
   *     resolved directly via the module loader, without needing a manual
   *     `import`.
   *  2) is able provide injections to classes that implement `extend`
   *     (as is typical with Ember).
   */

  function classFactory(klass) {
    return {
      create: function (injections) {
        if (typeof klass.extend === 'function') {
          return klass.extend(injections);
        } else {
          return klass;
        }
      }
    };
  }

  var underscore = Ember.String.underscore;
  var classify = Ember.String.classify;
  var get = Ember.get;

  function parseName(fullName) {
    /*jshint validthis:true */

    var nameParts = fullName.split(":"),
        type = nameParts[0], fullNameWithoutType = nameParts[1],
        name = fullNameWithoutType,
        namespace = get(this, 'namespace'),
        root = namespace;

    return {
      fullName: fullName,
      type: type,
      fullNameWithoutType: fullNameWithoutType,
      name: name,
      root: root,
      resolveMethodName: "resolve" + classify(type)
    };
  }

  function chooseModuleName(moduleEntries, moduleName) {
    var underscoredModuleName = Ember.String.underscore(moduleName);

    if (moduleName !== underscoredModuleName && moduleEntries[moduleName] && moduleEntries[underscoredModuleName]) {
      throw new TypeError("Ambiguous module names: `" + moduleName + "` and `" + underscoredModuleName + "`");
    }

    if (moduleEntries[moduleName]) {
      return moduleName;
    } else if (moduleEntries[underscoredModuleName]) {
      return underscoredModuleName;
    } else {
      var parts = moduleName.split('/'),
          lastPart = parts[parts.length - 1],
          partializedModuleName;

      parts[parts.length - 1] = lastPart.replace(/^-/, '_');
      partializedModuleName = parts.join('/');

      if (moduleEntries[partializedModuleName]) {
        Ember.deprecate('Modules should not contain underscores. ' +
                        'Attempted to lookup "'+moduleName+'" which ' +
                        'was not found. Please rename "'+partializedModuleName+'" '+
                        'to "'+moduleName+'" instead.', false);

        return partializedModuleName;
      } else {
        return moduleName;
      }
    }
  }

  function logLookup(found, parsedName, moduleName) {
    if (Ember.ENV.LOG_MODULE_RESOLVER) {
      var symbol;

      if (found) { symbol = '[✓]'; }
      else       { symbol = '[ ]'; }

      Ember.Logger.info(symbol, parsedName.fullName, new Array(40 - parsedName.fullName.length).join('.'), moduleName);
    }
  }

  function resolveOther(parsedName) {
    /*jshint validthis:true */

    var moduleName, tmpModuleName, prefix, podPrefix, moduleEntries;

    prefix = this.namespace.modulePrefix;
    podPrefix = this.namespace.podModulePrefix || prefix;
    moduleEntries = requirejs.entries;

    Ember.assert('module prefix must be defined', prefix);

    var pluralizedType = parsedName.type + 's';
    var name = parsedName.fullNameWithoutType;

    // lookup using POD formatting first
    tmpModuleName = podPrefix + '/' + name + '/' + parsedName.type;
    if (moduleEntries[tmpModuleName]) {
      moduleName = tmpModuleName;
    }

    // if not using POD format, use the custom prefix
    if (this.namespace[parsedName.type + 'Prefix']) {
      prefix = this.namespace[parsedName.type + 'Prefix'];
    }

    // if router:main or adapter:main look for a module with just the type first
    tmpModuleName = prefix + '/' + parsedName.type;
    if (!moduleName && name === 'main' && moduleEntries[tmpModuleName]) {
      moduleName = prefix + '/' + parsedName.type;
    }

    // fallback if not type:main or POD format
    if (!moduleName) { moduleName = prefix + '/' +  pluralizedType + '/' + name; }

    // allow treat all dashed and all underscored as the same thing
    // supports components with dashes and other stuff with underscores.
    var normalizedModuleName = chooseModuleName(moduleEntries, moduleName);

    if (moduleEntries[normalizedModuleName]) {
      var module = require(normalizedModuleName, null, null, true /* force sync */);

      if (module && module['default']) { module = module['default']; }

      if (module === undefined) {
        throw new Error(" Expected to find: '" + parsedName.fullName + "' within '" + normalizedModuleName + "' but got 'undefined'. Did you forget to `export default` within '" + normalizedModuleName + "'?");
      }

      if (this.shouldWrapInClassFactory(module, parsedName)) {
        module = classFactory(module);
      }

      logLookup(true, parsedName, moduleName);

      return module;
    } else {
      logLookup(false, parsedName, moduleName);

      return null;
    }
  }
  // Ember.DefaultResolver docs:
  //   https://github.com/emberjs/ember.js/blob/master/packages/ember-application/lib/system/resolver.js
  var Resolver = Ember.Resolver.extend({
    resolveOther: resolveOther,
    resolveTemplate: resolveOther,
  /**
    This method is called via the container's resolver method.
    It parses the provided `fullName` and then looks up and
    returns the appropriate template or class.

    @method resolve
    @param {String} fullName the lookup string
    @return {Object} the resolved factory
  */
  resolve: function(fullName) {
    var parsedName = this.parseName(fullName),
        resolveMethodName = parsedName.resolveMethodName;

    if (!(parsedName.name && parsedName.type)) {
      throw new TypeError("Invalid fullName: `" + fullName + "`, must be of the form `type:name` ");
    }

    if (this[resolveMethodName]) {
      var resolved = this[resolveMethodName](parsedName);
      if (resolved) { return resolved; }
    }
    return this.resolveOther(parsedName);
  },
  /**
    Returns a human-readable description for a fullName. Used by the
    Application namespace in assertions to describe the
    precise name of the class that Ember is looking for, rather than
    container keys.

    @protected
    @param {String} fullName the lookup string
    @method lookupDescription
  */
  lookupDescription: function(fullName) {
    var parsedName = this.parseName(fullName);

    if (parsedName.type === 'template') {
      return "template at " + parsedName.fullNameWithoutType.replace(/\./g, '/');
    }

    var description = parsedName.root + "." + classify(parsedName.name);
    if (parsedName.type !== 'model') { description += classify(parsedName.type); }

    return description;
  },

    makeToString: function(factory, fullName) {
      return '' + this.namespace.modulePrefix + '@' + fullName + ':';
    },
    parseName: parseName,
    shouldWrapInClassFactory: function(module, parsedName){
      return false;
    },
    normalize: function(fullName) {
      // replace `.` with `/` in order to make nested controllers work in the following cases
      // 1. `needs: ['posts/post']`
      // 2. `{{render "posts/post"}}`
      // 3. `this.render('posts/post')` from Route
      var split = fullName.split(':');
      if (split.length > 1) {
        return split[0] + ':' + Ember.String.dasherize(split[1].replace(/\./g, '/'));
      } else {
        return fullName;
      }
    }
  });

  Resolver['default'] = Resolver;
  return Resolver;
});

define("resolver",
  ["ember/resolver"],
  function (Resolver) {
    Ember.deprecate('Importing/requiring Ember Resolver as "resolver" is deprecated, please use "ember/resolver" instead');
    return Resolver;
  });
