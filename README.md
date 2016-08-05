# Ember Resolver [![Build Status](https://travis-ci.org/ember-cli/ember-resolver.svg?branch=master)](https://travis-ci.org/ember-cli/ember-resolver)


This project is tracking a new resolver based on ES6 semantics that has been extracted from (and used by) the following projects:

* [ember-cli](https://github.com/ember-cli/ember-cli)
* [ember-app-kit](https://github.com/stefanpenner/ember-app-kit)
* [ember-appkit-rails](https://github.com/DavyJonesLocker/ember-appkit-rails)

## Installation

Ember-resolver was previously a bower package, but since v1.0.1, it has become an ember-cli addon, and should be installed with `ember install`:
```
ember install ember-resolver
```

If you're currently using ember-resolver v0.1.x in your project, you should uninstall it:
```
bower uninstall ember-resolver --save
```

_You can continue to use ember-resolver v0.1.x as a bower package, but be careful not to update it to versions greater than v1.0._

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

## Troubleshooting

As mentioned above, `ember-resolver` is no longer a bower package.  If you're seeing a message like this:

```
Unable to find a suitable version for ember-resolver, please choose one:
    1) ember-resolver#~0.1.20 which resolved to 0.1.21 and is required by ember-resolver#2.0.3
    2) ember-resolver#~2.0.3 which resolved to 2.0.3 and is required by [APP_NAME]
```

... you probably need to update your application accordingly.  See aptible/dashboard.aptible.com#423 as an example of how to update.
