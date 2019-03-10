/*
   This function merges the types and collections from addons `addonsConfig` into `config`.

   It will throw an exception if an addon tries to override
   an existing type or collection on the resolver config object or
   if two addons provide the same type or collection.

   - `config`: is a resolver config object.

   - `addonsConfig`: is a hash object containing the result of the call of
      `addon.resolverConfig` method on all the project addons.

     ```js
     {
      my-addon1: { types: { ... } },
      my-addon2: { collections: { ... } },
      hola-addon: { types: { ... }, collections: { ... } }
     }
     ```
 */
export default function mergeAddonsConfig(config, addonsConfig) {

  Object.keys(addonsConfig).forEach(function (addonName) {
    let addonConfig = addonsConfig[addonName];
    let addonTypes = addonConfig.types || {};
    let addonCollections = addonConfig.collections || {};

    Object.keys(addonTypes).forEach(function (key) {
      if (!config.types.hasOwnProperty(key)) {
        config.types[key] = addonTypes[key];
      } else {
        throw new Error(`Addon '${addonName}' attempts to configure the type '${key}' on the resolver but '${key}' has already been configured.`);
      }
    });
    Object.keys(addonCollections).forEach(function (key) {
      if (!config.collections.hasOwnProperty(key)) {
        config.collections[key] = addonCollections[key];
      } else {
        throw new Error(`Addon '${addonName}' attempts to configure the collection '${key}' on the resolver but '${key}' has already been configured.`);
      }
    });
  });
}
