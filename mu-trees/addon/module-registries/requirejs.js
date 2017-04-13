/* global require, requirejs */
import {
  deserializeSpecifier
} from '@glimmer/di';

export default class RequireJSRegistry {

  constructor(config, modulePrefix, _requirejs = requirejs, _require = require) {
    this._config = config;
    this._modulePrefix = modulePrefix;
    this.requirejs = _requirejs;
    this.require = _require;
  }

  normalize(specifier) {
    let s = deserializeSpecifier(specifier);

    // This is hacky solution to get around the fact that Ember
    // doesn't know it is requesting a partial. It requests something like
    // 'template:/my-app/routes/-author'
    // Would be better to request 'template:my-app/partials/author'
    let isPartial = s.type === 'template' && s.name[0] === '-';
    if (isPartial) {
      s.name = s.name.slice(1);
      s.collection = 'partials';
    }

    let collectionDefinition = this._config.collections[s.collection];
    let group = collectionDefinition && collectionDefinition.group;
    let segments = [ s.rootName, this._modulePrefix ];

    if (group) {
      segments.push(group);
    }

    // Special case to handle definiteCollection for templates
    // eventually want to find a better way to address.
    // Dgeb wants to find a better way to handle these
    // in config without needing definiteCollections.
    let ignoreCollection = s.type === 'template' &&
      s.collection === 'routes' &&
      s.namespace === 'components';

    // Ember requests location as
    // "location:/my-app/main/location-name"
    // so deserializer incorrectly sets collection to
    // 'main' instead of 'location'
    if (s.type === 'location') {
      s.collection = 'locations';
    }

    if (s.collection !== 'main' && !ignoreCollection) {
      segments.push(s.collection);
    }

    if (s.namespace) {
      segments.push(s.namespace);
    }

    if (s.name !== 'main') {
      segments.push(s.name);
    }

    // Things like a service or route can exist at
    // my-app/src/ui/routes/application or
    // my-app/src/ui/routes/application/route
    // Certain things like templates, things are exist as 'main',
    // and partials, cannot.
    // TODO MAKE CONFIGURABLE
    const allowOptionalTypeSuffix = (s.collection !== 'main') &&
          (s.type !== 'template') &&
          (!isPartial);

    const type = allowOptionalTypeSuffix ? s.type : '';

    if (!allowOptionalTypeSuffix && !isPartial) {
      segments.push(s.type);
    }

    let path = segments.join('/');

    return {
      path,
      type
    };
  }

  _pathForSpecifier(specifier) {
    const { path, type } = this.normalize(specifier);

    if (path in this.requirejs.entries) {
      return path;
    }

    if (!type) { return; }

    let typedPath = `${path}/${type}`;

    return typedPath in this.requirejs.entries && typedPath;
  }

  has(specifier) {
    return !!this._pathForSpecifier(specifier);
  }

  get(specifier) {
    const path = this._pathForSpecifier(specifier);
    return this.require(path).default;
  }
}
