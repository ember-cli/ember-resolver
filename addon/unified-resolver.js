import Ember from 'ember';
import ModuleRegistry from './utils/module-registry';
import DefaultConfig from './ember-config';

const { DefaultResolver } = Ember;

const Resolver = DefaultResolver.extend({
  init() {
    this._super(...arguments);

    if (!this.config) {
      this.config = DefaultConfig;
    }

    this._modulePrefix = `${this.namespace.modulePrefix}/src`;
    if (!this._moduleRegistry) {
      this._moduleRegistry = new ModuleRegistry();
    }
  },

  expandLocalLookup(lookupString, sourceLookupString) {
    let { type, name } = this._parseLookupString(lookupString);
    let source = this._parseLookupString(sourceLookupString);
    let sourceCollectionConfig = this.config.collections[source.collection];

    // Perhaps should blow up if you are not in the types, TODO bad error state in here
    let expandedLookupString;
    if (sourceCollectionConfig.types.indexOf(type) === -1 && sourceCollectionConfig.privateCollections) {
      let privateCollection;
      sourceCollectionConfig.privateCollections.forEach(key => {
        let privateCollectionConfig = this.config.collections[key];
        // If the lookup type is permitted in this specific private collection
        if (privateCollectionConfig.types.indexOf(type) !== -1) {
          if (privateCollection) {
            throw new Error(`More than one private collection supporting type "${type}" was available in collection ${source.collection}`);
          }
          privateCollection = key;
        }
      });
      expandedLookupString = `${type}:${source.name}/-${privateCollection}/${name}`;
    } else {
      expandedLookupString = `${type}:${source.name}/${name}`;
    }

    let { name: moduleName, exportName } = this._resolveLookupStringToModuleName(expandedLookupString);

    if (this._moduleRegistry.has(moduleName) && this._moduleRegistry.get(moduleName, exportName)) {
      return expandedLookupString;
    }

    return null;
  },

  _resolveLookupStringToModuleName(lookupString) {
    let { type, collection, group, isDefaultType, name } = this._parseLookupString(lookupString);

    // Main factories have no collection
    if (name === 'main') {
      // throw if the collection is not ''
      let path = `${this._modulePrefix}/${type}`;
      if (this._moduleRegistry.has(path)) {
        return {name: path, exportName: 'default'};
      }
      return null;
      // throw new Error(`Could not resolve factory '${lookupString}' at path '${path}'`);
    }

    let parts = name.split('/-');

    // If we have a private collection
    if (parts.length === 2) {
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
      } else {
        let { unresolvableCollections } = this.config;
        if (unresolvableCollections && unresolvableCollections[privateCollection]) {
          // Configuring a collection to be { resolvable: false } stops that
          // collection from being resolved at the top level. It also means that
          // the collection cannot be used as a private collection regardless of
          // whether it is listed explicitly as a private collection.
          throw new Error(`attempted to resolve a module in the unresolvable collection "${privateCollection}"`);
        }
      }
    } else if (parts.length > 2) {
      throw new Error('Non-ambiguous, but painful to parse case');
    }

    // Other factories have a collection
    let groupSegment = group ? `${group}/` : '';
    let namePath = `${this._modulePrefix}/${groupSegment}${collection}/${name}`;

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
  resolve(lookupString) {
    let moduleDef = this._resolveLookupStringToModuleName(lookupString);
    if (moduleDef && this._moduleRegistry.has(moduleDef.name)) {
      console.log('resolve: ' + lookupString + ' √');
      return this._moduleRegistry.get(moduleDef.name, moduleDef.exportName);
    } else {
      console.log('resolve: ' + lookupString + ' []');
    }
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
