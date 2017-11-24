import Ember from 'ember';
import GlimmerResolver from '@glimmer/resolver/resolver';
import RequireJSRegistry from '../../module-registries/requirejs';

const { DefaultResolver, String: { dasherize } } = Ember;

function slasherize(dotted) {
  return dotted.replace(/\./g, '/');
}

const TEMPLATE_TO_PARTIAL = /^template:(.*\/)?_([\w-]+)/;

/*
 * Wrap the @glimmer/resolver in Ember's resolver API. Although
 * this code extends from the DefaultResolver, it should never
 * call `_super` or call into that code.
 */
const Resolver = DefaultResolver.extend({
  init() {
    this._super(...arguments);

    this._configRootName = this.config.app.rootName || 'app';

    if (!this.glimmerModuleRegistry) {
      this.glimmerModuleRegistry = new RequireJSRegistry(this.config, 'src');
    }

    this._glimmerResolver = new GlimmerResolver(this.config, this.glimmerModuleRegistry);
  },

  normalize: null,

  resolve(lookupString, referrer, rawString) {
    /*
     * Ember namespaces are part of the raw invocation passed as a third
     * argument, for example other-addon::some-service
     */
    let rootName = this._configRootName;
    let rawStringName = null;
    if (rawString) {
      let [namespace, name] = rawString.split('::');
      rootName = namespace;
      rawStringName = name;
    }

    let [type, lookupStringName] = lookupString.split(':');
    let name = lookupStringName;

    /*
     * Ember components require their lookupString to be massaged. Make this
     * as "pay-go" as possible.
     */
    if (referrer) {
      // make absolute
      let parts = referrer.split(':src/ui/');
      referrer = `${parts[0]}:/${rootName}/${parts[1]}`;
      referrer = referrer.split('/template.hbs')[0];
    } else if (rawString) {
      // This is only required because:
      // https://github.com/glimmerjs/glimmer-di/issues/45
      referrer = `${type}:/${rootName}/`;
    }

    /* If there is no name, fallback to the name passed in the rawString */
    if (!name) {
      name = rawStringName;
    }
    if (name) {
      if (type === 'service') {
        /* Services may be camelCased */
        lookupString = `service:${dasherize(name)}`;
      } else if (type === 'route') {
        /* Routes may have.dot.paths */
        lookupString = `route:${slasherize(name)}`;
      } else if (type === 'controller') {
        /* Controllers may have.dot.paths */
        lookupString = `controller:${slasherize(name)}`;
      } else if (type === 'template') {
        if (lookupStringName && lookupStringName.indexOf('components/') === 0) {
          let sliced = lookupStringName.slice(11);
          lookupString = `template:${sliced.length ? sliced : rawStringName}`;
        } else {
          /*
           * Ember partials are looked up as templates. Here we replace the template
           * resolution with a partial resolute when appropriate. Try to keep this
           * code as "pay-go" as possible.
           */
          let match = TEMPLATE_TO_PARTIAL.exec(lookupString);
          if (match) {
            let namespace = match[1] || '';
            let name = match[2];

            lookupString = `partial:${namespace}${name}`;
          } else {
            if (referrer) {
              throw new Error(`Cannot look up a route template ${lookupString} with a referrer`);
            }
            /*
             * Templates for routes must be looked up with a referrer. They may
             * have dots.in.paths
             */
            lookupString = `template`;
            referrer = `route:/${rootName}/routes/${slasherize(name)}`;
          }
        }
      }
    }

    return this._resolve(lookupString, referrer);
  },

  _resolve(lookupString, referrer) {
    return this._glimmerResolver.resolve(lookupString, referrer);
  }

});

export default Resolver;
