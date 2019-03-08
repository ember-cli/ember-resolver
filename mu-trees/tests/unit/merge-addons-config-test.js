import { module, test } from "qunit";
import mergeAddonsConfig from "ember-resolver/merge-addons-config";

module("ember-resolver/merge-addons-config");

const emptyConfig = function() {
  return { types: {}, collections: {} };
};

test("Trigger error if two addons configure the same type", function(assert) {
  let addonsConfig = {
    "my-addon1": { types: { hola: "hola" } },
    "my-addon2": { types: { hola: "adios" } }
  };

  assert.throws(function() {
    mergeAddonsConfig(emptyConfig(), addonsConfig);
  });
});

test("Trigger error if two addons configure the same collection", function(assert) {
  let addonsConfig = {
    "my-addon1": { collections: { hola: "hola" } },
    "my-addon2": { collections: { hola: "adios" } }
  };

  assert.throws(function() {
    mergeAddonsConfig(emptyConfig(), addonsConfig);
  });
});

test("Trigger error if addon overwrite an existing type", function(assert) {
  let addonsConfig = {
    "my-addon1": { types: { hola: "new-hola" } }
  };

  let config = { types: { hola: "hola" } };
  assert.throws(function() {
    mergeAddonsConfig(config, addonsConfig);
  });
});

test("Trigger error if addon overwrite an existing collection", function(assert) {
  let addonsConfig = {
    "my-addon1": { collections: { hola: "new-hola" } }
  };

  let config = { collections: { hola: "hola" } };
  assert.throws(function() {
    mergeAddonsConfig(config, addonsConfig);
  });
});

test("Can merge collections", function(assert) {
  let addonsConfig = {
    "my-addon1": { collections: { col1: "foo" } },
    "my-addon2": { collections: { col2: "baz" } }
  };

  let result = emptyConfig();
  mergeAddonsConfig(result, addonsConfig);
  assert.deepEqual(result.collections, { col1: "foo", col2: "baz" });
});

test("Can merge types", function(assert) {
  let addonsConfig = {
    "my-addon1": { types: { col1: "foo" } },
    "my-addon2": { types: { col2: "baz" } }
  };

  let result = emptyConfig();
  mergeAddonsConfig(result, addonsConfig);
  assert.deepEqual(result.types, { col1: "foo", col2: "baz" });
});
