/* global require, requirejs */
import {
  deserializeSpecifier
} from '@glimmer/di';

export default class RequireJSRegistry {

  constructor(config, modulePrefix, require=self.requirejs) {
    this._config = config;
    this._modulePrefix = modulePrefix;
    this._require = require;
  }

  _baseSegments(s) {
    let collectionDefinition = this._config.collections[s.collection];
    let group = collectionDefinition && collectionDefinition.group;
    let segments = [ s.rootName, this._modulePrefix ];

    if (group) {
      segments.push(group);
    }

    // Special case to handle definitiveCollection for templates
    // eventually want to find a better way to address.
    // Dgeb wants to find a better way to handle these
    // in config without needing definitiveCollection.
    let ignoreCollection = s.type === 'template' &&
      s.collection === 'routes' &&
      s.namespace === 'components';

    if (s.collection !== 'main' && !ignoreCollection) {
      segments.push(s.collection);
    }

    if (s.namespace) {
      segments.push(s.namespace);
    }

    if (s.name !== 'main') {
      segments.push(s.name);
    }

    return segments;
  }

  _detectModule(specifierString, lookupMethod) {
    let specifier = deserializeSpecifier(specifierString);

    let segments = this._baseSegments(specifier);
    let basePath = `${segments.join('/')}`;
    let typedPath = `${basePath}/${specifier.type}`;

    let lookupResult = lookupMethod(typedPath);

    if (
      !lookupResult &&
      this._config.collections[specifier.collection].defaultType === specifier.type
    ) {
      lookupResult = lookupMethod(basePath);
    }

    return lookupResult;
  }

  has(specifierString) {
    return this._detectModule(specifierString, path => {
      /*
       * Worth noting this does not confirm there is a default export,
       * as would be expected with this simple implementation of the module
       * registry.
       *
       * To preserve sanity, the `get` method throws when a `default`
       * export is not found.
       */
      return path in this._require.entries;
    });
  }

  get(specifierString) {
    let module = this._detectModule(specifierString, path => {
      return (path in this._require.entries) && this._require(path);
    });

    if (!module) {
      return module;
    }

    if (!module.default) {
      throw new Error('RequireJSRegistry expects all resolved modules to have a default export.');
    }
    return module.default;
  }
}
