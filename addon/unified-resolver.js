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

  resolve(lookupString, options) {
    let { type, collection, group, isDefaultType, name } = this._parseLookupString(lookupString);

    // Main factories have no collection
    if (name === 'main') {
      // throw if the collection is not ''
      let path = `${options.namespace}/${type}`;
      return this._moduleRegistry.get(path);
    }

    // Other factories have a collection
    let groupSegment = group ? `${group}/` : '';
    let namePath = `${options.namespace}/${groupSegment}${collection}/${name}`;
    try {
      // TODO: Why can we not requirejs.has?
      return this._moduleRegistry.get(`${namePath}/${type}`);
    } catch(e) {
      if (isDefaultType) {
        return this._moduleRegistry.get(namePath);
      } else {
        let factory = this._moduleRegistry.get(namePath, type);
        if (factory) {
          return factory;
        }
        /*
         * Don't throw a special error in this case. Allow the default error
         * of a missing file with name/type expected in the path to be thrown.
         */
      }
      throw e;
    }
  },

  _parseLookupString(lookupString) {
    let [type, name] = lookupString.split(':');
    let configForType = this.config.types[type];
    if (!configForType) {
      throw new Error(`"${type}" not a recognized type`);
    }

    // TODO If we have a private collection (e.g. '-components') then that
    // collection should be used. However we don't have a test case for this yet.
    // yet.
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

/*
function parseFactoryName(factoryName, collection) {
  let parts = new RegExp(`${collection}/(.*)/([^/]*)`).exec(factoryName);
  return [parts[1], parts[2]];
}
*/

export default Resolver;
