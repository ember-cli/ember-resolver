## Module Report
### Unknown Global

**Global**: `Ember.ENV`

**Location**: `addon/resolvers/classic/index.js` at line 359

```js
  // only needed until 1.6.0-beta.2 can be required
  _logLookup(found, parsedName, description) {
    if (!Ember.ENV.LOG_MODULE_RESOLVER && !parsedName.root.LOG_RESOLVER) {
      return;
    }
```

### Unknown Global

**Global**: `Ember.TEMPLATES`

**Location**: `tests/unit/resolvers/classic/basic-test.js` at line 391

```js

test("can lookup templates via Ember.TEMPLATES", function(assert) {
  Ember.TEMPLATES['application'] = function() {
    return '<h1>herp</h1>';
  };
```

### Unknown Global

**Global**: `Ember.ENV`

**Location**: `tests/unit/resolvers/classic/basic-test.js` at line 522

```js
  });

  Ember.ENV.LOG_MODULE_RESOLVER = true;

  resolver.resolve('fruit:orange');
```

### Unknown Global

**Global**: `Ember.ENV`

**Location**: `tests/unit/resolvers/classic/basic-test.js` at line 534

```js
  });

  Ember.ENV.LOG_MODULE_RESOLVER = false;

  resolver.resolve('fruit:orange');
```
