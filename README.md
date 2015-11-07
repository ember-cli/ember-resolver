loader.js [![Build Status](https://travis-ci.org/ember-cli/loader.js.png?branch=master)](https://travis-ci.org/ember-cli/loader.js)
=========

Minimal AMD loader mostly stolen from [@wycats](https://github.com/wycats).

## No Conflict

To prevent the loader from overriding `require`, `define`, or `requirejs` you can instruct the loader
to use no conflict mode by providing it an alternative name for the various globals that are normally used.

Example:

```js
loader.noConflict({
  define: 'newDefine',
  require: 'newRequire'
});
```

Note: To be able to take advantage of alternate `define` method name, you will also need to ensure that your
build tooling generates using the alternate.  An example of this is done in the [emberjs-build](https://github.com/emberjs/emberjs-build)
project in the [babel-enifed-module-formatter plugin](https://github.com/emberjs/emberjs-build/blob/v0.4.2/lib/utils/babel-enifed-module-formatter.js).

## Tests

To run the test you'll need to have
[testem](https://github.com/airportyh/testem) installed. Install it with `npm
install -g testem`.

_(You'll also have to install the bower components, which you can do by running
`bower install`)_

You may run them with:
```bash
testem ci
```

You can also launch testem development mode with:
```bash
testem
```

## License

loader.js is [MIT Licensed](https://github.com/ember-cli/loader.js/blob/master/LICENSE.md).
