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
    let {type, collection, group, isDefaultType, name} = this._parseLookupString(lookupString);

    // main factories have a simple lookup strategy.
    if (name === 'main') {
      // throw if the collection is not ''
      let path = `${options.namespace}/${type}`;
      return this._moduleRegistry.get(path);
    }

    // other factories have a collection
    let groupSegment = group ? `${group}/` : '';
    let path = `${options.namespace}/${groupSegment}${collection}/${name}/${type}`;
    try {
      // TODO: Why can we not requirejs.has or this._moduleRegistry.has?
      return this._moduleRegistry.get(path);
    } catch(e) {
      let path = `${options.namespace}/${groupSegment}${collection}/${name}`;

      if (isDefaultType) {
        return this._moduleRegistry.get(path);
      } else {
        let factory = this._moduleRegistry.get(path, type);
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

    let {collection} = configForType;

    let collectionConfig = this.config.collections[collection];
    if (collectionConfig.types.indexOf(type) === -1) {
      throw new Error(`"${type}" not a recognized type`);
    }

    let isDefaultType = collectionConfig.defaultType === type;
    let {group} = collectionConfig;

    return {type, collection, group, isDefaultType, name};
  }
});

/*
function parseFactoryName(factoryName, collection) {
  let parts = new RegExp(`${collection}/(.*)/([^/]*)`).exec(factoryName);
  return [parts[1], parts[2]];
}
*/

export default Resolver;
