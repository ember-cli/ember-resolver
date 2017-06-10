import Ember from 'ember';
import GlimmerResolver from '@glimmer/resolver/resolver';
import RequireJSRegistry from '../../module-registries/requirejs';

const { DefaultResolver } = Ember;

const TEMPLATE_TO_PARTIAL = /^template:(.*\/)?_([\w-]+)/;

/*
 * Wrap the @glimmer/resolver in Ember's resolver API. Although
 * this code extends from the DefaultResolver, it should never
 * call `_super` or call into that code.
 */
const Resolver = DefaultResolver.extend({
  init() {
    this._super(...arguments);

    if (!this.glimmerModuleRegistry) {
      this.glimmerModuleRegistry = new RequireJSRegistry(this.config, 'src');
    }

    this._glimmerResolver = new GlimmerResolver(this.config, this.glimmerModuleRegistry);
  },

  normalize: null,

  resolve(lookupString) {
    /*
     * Ember paritals are looked up as templates. Here we replace the template
     * resolution with a partial resolute when appropriate. Try to keep this
     * code as "pay-go" as possible.
     */

    if (lookupString.indexOf('template:') === 0) {
      lookupString = this._templateToPartial(lookupString);
    }
    return this._resolve(lookupString);
  },

  _resolve(lookupString) {
    return this._glimmerResolver.resolve(lookupString);
  },

  /*
   * templates may actually be partial lookups, so consider them as possibly
   * such and return the correct lookupString.
   */
  _templateToPartial(lookupString) {
    let match = TEMPLATE_TO_PARTIAL.exec(lookupString);
    if (!match) {
      return lookupString;
    }

    let namespace = match[1] || '';
    let name = match[2];

    return `partial:${namespace}${name}`;
  }
});

export default Resolver;
