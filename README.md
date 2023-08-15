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
    ...this.pluralizedTypes,
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

## Addon Development

### Installation

* `git clone` this repository
* `npm install`
* `bower install`

### Running

* `ember server`
* Visit your app at http://localhost:4200.

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
