# Ember Resolver [![CI Build](https://github.com/ember-cli/ember-resolver/actions/workflows/ci-build.yml/badge.svg)](https://github.com/ember-cli/ember-resolver/actions/workflows/ci-build.yml)

The Ember Resolver is the mechanism responsible for looking up code in your application and converting its naming conventions into the actual classes, functions, and templates that Ember needs to resolve its dependencies, for example, what template to render for a given route. It is a system that helps the app resolve the lookup of JavaScript modules agnostic of what kind of module system is used, which can be AMD, CommonJS or just plain globals. It is used to lookup routes, models, components, templates, or anything that is used in your Ember app.

This project provides the Ember resolver used by [ember-cli](https://github.com/ember-cli/ember-cli)

## Installation

`ember-resolver` is an ember-cli addon, and should be installed with `ember install`:

```
ember install ember-resolver
```

## Configuration

To customize pluralization provide a `pluralizedTypes` object to your applications resolver:

```js
// app/app.js
import Resolver from 'ember-resolver';

export default class AppResolver extends Resolver {
  pluralizedTypes = {
    'sheep': 'sheep',
    'strategy': 'strategies'
  }
}

// ...snip...
export default class App extends Application {
  // ...snip...
  Resolver = AppResolver;
}

// ...snip...
```

## Strict

> Originally from <https://github.com/stefanpenner/ember-strict-resolver>

in app/resolver.js

```js
export { default } from "ember-strict-resolver";
```

_For additional improvements when fully using the ember-strict-resolver monkey patching the registry to no longer cache and simply returning the values passed like the following can be produce extra performance._

```js
// disable the normalization cache as we no longer normalize, the cache has become a bottle neck.
Ember.Registry.prototype.normalize = function (i) {
  return i;
};
```

## Migration

Migrating away from use the _ember-resolver/classic_ can be done in piecemeal by supporting a sub-set of the old resolution formats.

> normalize is needed, because without it you will get errors related to failing to be able to inject services that were never normalized in the registry.

```js
// app/resolver.js

import Resolver from "ember-strict-resolver";

export default class extends Resolver {
  legacyMappings = {
    "service:camelCaseNotSupported": "service:camel-case-not-supported",
  };

  resolve(_fullName) {
    return super.resolve(this.legacyMappings[_fullName] || _fullName);
  }

  normalize(_fullName) {
    return this.legacyMappings[_fullName] || _fullName;
  }
}
```

This will allow you file PRs with libraries that currently do not support the strict resolver in its entirety.

In the event that you have a component that is failing to resolve correctly with the error `Attempted to lookup "helper:nameOfVariable". Use "helper:name-of-variable" instead.` please convert your template to use explicit-this. The template lint can be enabled by turning on [no-implicit-this](https://github.com/ember-template-lint/ember-template-lint/blob/master/docs/rule/no-implicit-this.md).

An example of what this looks like is the following

```hbs
// addon/components/templates/foo.hbs

<div>
  {{fullName}}
</div>
```

This will result in the error, `Attempted to lookup "helper:fullName". Use "helper:full-name" instead.`. The fix for this would be to decide if this is a argument being passed into foo or if this is a local property.

_fullName_ is coming from an invocation of _Foo_ like the following:

```
<Foo
  @fullName="The Teamster"
/>
```

Then the fix for your template would be:

```hbs
// addon/components/templates/foo.hbs

<div>
  {{@fullName}}
</div>
```

If _fullName_ is a property on your component the fix would be:

```hbs
// addon/components/templates/foo.hbs

<div>
  {{this.fullName}}
</div>
```

## Addon Development

### Installation

- `git clone` this repository
- `npm install`
- `bower install`

### Running

- `ember server`
- Visit your app at http://localhost:4200.

### Running Tests

- `ember test`
- `ember test --server`

### Building

- `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
