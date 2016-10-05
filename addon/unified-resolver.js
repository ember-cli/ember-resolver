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

  _privateLookup(typeName, moduleName, options) {
    let privateCollection = this._collection.privateCollections[options.source];
    let moduleId = privateCollection[moduleName];
    let module = this._getModule(moduleId);
    let exportName;

    if (typeName === "component") {
      exportName = "default";
    } else if (typeName === "helper") {
      exportName = "helper";
    }

    if (!!module && module.exports.includes(exportName)) {
      return [moduleId, exportName];
    }
    return [];
  },

  _getModule(moduleId) {
    return this._collection.modules[moduleId];
  },

  _getCollectionConfig(collectionName) {
    return this._collection.config.collections[collectionName];
  },

  _searchCollectionsForModule(namespace, typeName, moduleName) {
    let moduleId;
    let collectionConfig;
    let possibleCollections = [];

    for(let collectionKey in this._collection.config.collections) {
      let collection = this._getCollectionConfig(collectionKey);
      if (collection.types && collection.types.includes(typeName)) {
        possibleCollections.push(collectionKey);
      }
    }

    for(let index = 0; index < possibleCollections.length; index++) {
      let collectionKey = possibleCollections[index];
      moduleId = this._collection.collections[namespace][collectionKey][moduleName];
      if (moduleId) {
        collectionConfig = this._getCollectionConfig(collectionKey);
        break;
      }
    }

    return [moduleId, collectionConfig];
  },

  findModuleAndExport(moduleNameWithType, options = {}) {
    let [typeName, moduleName] = moduleNameWithType.split(':');

    if (!!options.source) {
      return this._privateLookup(typeName, moduleName, options);
    }
    let typeConfig = this._collection.config.types[typeName];
    let namespace = options.namespace || this._defaultNamespace;
    let collectionConfig;
    let moduleId;

    if (typeConfig && typeConfig.definitiveCollection) {
      let collectionName = typeConfig.definitiveCollection;
      collectionConfig = this._getCollectionConfig(collectionName);
      moduleId = this._collection.collections[namespace][collectionName][moduleName];
    } else {
      [moduleId, collectionConfig] = this._searchCollectionsForModule(namespace, typeName, moduleName);
    }

    let moduleIdType;
    if (typeof moduleId === 'object' && moduleId[typeName]) {
      moduleId = moduleId[typeName];
      moduleIdType = typeName;
    }

    let module = this._getModule(moduleId);
    let exportName;

    if ((typeName === collectionConfig.defaultType || moduleIdType) && module.exports.includes('default')) {
      exportName = 'default';
    } else if (module.exports.includes(typeName)) {
      exportName = typeName;
    }

    return [moduleId, exportName];
  },

  // this returns the actual module
  resolve(lookupString, options) {
    let {type, collection, isDefaultType, name} = this._parseLookupString(lookupString);

    // main factories have a simple lookup strategy.
    if (name === 'main') {
      // throw if the collection is not ''
      let path = `${options.namespace}/${type}`;
      return this._moduleRegistry.get(path);
    }

    // other factories have a collection
    let path = `${options.namespace}/${collection}/${name}/${type}`;
    try {
      // TODO: Why can we not requirejs.has?
      return this._moduleRegistry.get(path);
    } catch(e) {
      if (isDefaultType) {
        let path = `${options.namespace}/${collection}/${name}`;
        return this._moduleRegistry.get(path);
      }
      throw e;
    }
  },

  _parseLookupString(lookupString) {
    let [type, name] = lookupString.split(':');
    let {collection} = this.config.types[type];

    let collectionConfig = this.config.collections[collection];
    if (collectionConfig.types.indexOf(type) === -1) {
      throw new Error(`"${type}" not a recognized type`);
    }

    let isDefaultType = collectionConfig.defaultType === type;

    return {type, collection, isDefaultType, name};
  }
});

/*
function parseFactoryName(factoryName, collection) {
  let parts = new RegExp(`${collection}/(.*)/([^/]*)`).exec(factoryName);
  return [parts[1], parts[2]];
}
*/

export default Resolver;
