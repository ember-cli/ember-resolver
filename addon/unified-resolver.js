import Ember from 'ember';
import ModuleRegistry from './utils/module-registry';

const { DefaultResolver } = Ember;

const Resolver = DefaultResolver.extend({
  init() {
    this._super(...arguments);

    if (!this._moduleRegistry) {
      this._moduleRegistry = new ModuleRegistry();
    }
  },

  expandLocalLookup(lookupString, sourceLookupString, options) {
    let { type, name } = this._parseLookupString(lookupString);
    let { name: sourceName } = this._parseLookupString(sourceLookupString);

    let expandedLookupString = `${type}:${sourceName}/${name}`;
    let { name: moduleName, exportName } = this._resolveLookupStringToModuleName(expandedLookupString, options);

    if (this._moduleRegistry.has(moduleName) && this._moduleRegistry.get(moduleName, exportName)) {
      return expandedLookupString;
    }

    return null;
  },

  _resolveLookupStringToModuleName(lookupString, options) {
    let { type, collection, group, isDefaultType, name } = this._parseLookupString(lookupString);

    // Main factories have no collection
    if (name === 'main') {
      // throw if the collection is not ''
      let path = `${options.namespace}/${type}`;
      if (this._moduleRegistry.has(path)) {
        return {name: path, exportName: 'default'};
      }
      throw new Error(`Could not resolve factory '${lookupString}' at path '${path}'`);
    }

    let parts = name.split('/-');
    if (parts.length === 2) {
      // We have a private collection
      let privateCollection = parts[1].split('/')[0];
      if (collection === privateCollection) {
        // The proposed source collection cannot be correct, since the
        // private collection is the same. A private collection cannot be
        // in itself. For example: src/ui/component/phone-book/-components/
        let alternativeCollections = [];
        Object.keys(this.config.collections).filter(collection => {
          let collectionDef = this.config.collections[collection];
          if (collectionDef.privateCollections && collectionDef.privateCollections.indexOf(privateCollection) !== -1) {
            alternativeCollections.push(collection);
          }
        });
        if (alternativeCollections.length > 1) {
          throw new Error('a private collection should not be configured for more than one collection');
        }
        collection = alternativeCollections[0];
        group = this.config.collections[collection].group;
      }
    } else if (parts.length > 2) {
      throw new Error('Non-ambiguous, but painful to parse case');
    }

    // Other factories have a collection
    let groupSegment = group ? `${group}/` : '';
    let namePath = `${options.namespace}/${groupSegment}${collection}/${name}`;

    let path = `${namePath}/${type}`;
    if (this._moduleRegistry.has(path)) {
      return {name: path, exportName: 'default'};
    }

    if (isDefaultType) {
      return { name: namePath, exportName: 'default' };
    }

    return { name: namePath, exportName: type };
  },

  // this returns the actual module
  resolve(lookupString, options) {
    let { name, exportName } = this._resolveLookupStringToModuleName(lookupString, options);
    return this._moduleRegistry.get(name, exportName);
  },

  _parseLookupString(lookupString) {
    let [type, name] = lookupString.split(':');
    let configForType = this.config.types[type];
    if (!configForType) {
      throw new Error(`"${type}" not a recognized type`);
    }

    let { definitiveCollection: collection, fallbackCollectionPrefixes } = configForType;

    // Handle a collection prefix like 'template:components/my-component'
    if (fallbackCollectionPrefixes) {
      let collectionPrefix = Object.keys(fallbackCollectionPrefixes).find(prefix => {
        return name.indexOf(prefix) === 0;
      });

      if (collectionPrefix) {
        name = name.slice(collectionPrefix.length);
        collection = fallbackCollectionPrefixes[collectionPrefix];
      }
    }

    let collectionConfig = this.config.collections[collection];

    /* TODO validation incorrect */
    if (collectionConfig.types.indexOf(type) === -1) {
      throw new Error(`"${type}" not a recognized type for ${collection} collection`);
    }

    let isDefaultType = collectionConfig.defaultType === type;
    let { group } = collectionConfig;

    return { type, collection, group, isDefaultType, name };
  }
});

export default Resolver;
