/**
   This function provides the types and collections from addons `addonsConfig` to `ember-config`.

   It will throw an exception if an addon tries to override
   an existing type or collection on the resolver config object or
   if two addons provide the same type or collection.

   - `config`: is the resolver config generated with `ember-resolver/ember-config`

   - `addonsConfig`: is a hash object containing the result of the call of
      `addon.resolverConfig` method on all the project addons.

     ```js
     {
      my-addon1: { types: { ... } },
      my-addon2: { collections: { ... } },
      hola-addon: { types: { ... }, collections: { ... } }
     }
     ```

     The value of `addonsConfig` is be imported from 'ember-resolver/addons-config'.
 */
export default function mergeAddonsConfig(config, addonsConfig) {

  // This implementation does not allow an addon to overwrite the default MU module resolution.
  // Is this the expected behaviour?
  Object.keys(addonsConfig).forEach(function (addonName) {
    let addonConfig = addonsConfig[addonName];
    let addonTypes = addonConfig.types || {};
    let addonCollections = addonConfig.collections || {};

    Object.keys(addonTypes).forEach(function (key) {
      if (!config.types.hasOwnProperty(key)) {
        config.types[key] = addonTypes[key];
      } else {
        // A similar validation is done during the build phase on `index.validateAddonsConfig`
        throw new Error(`Addon '${addonName}' attempts to configure the type '${key}' on the resolver but '${key}' has already been configured.`);
      }
    });
    Object.keys(addonCollections).forEach(function (key) {
      if (!config.collections.hasOwnProperty(key)) {
        config.collections[key] = addonCollections[key];
      } else {
        // A similar validation is done during the build phase on `index.validateAddonsConfig`
        throw new Error(`Addon '${addonName}' attempts to configure the collection '${key}' on the resolver but '${key}' has already been configured.`);
      }
    });
  });
}
