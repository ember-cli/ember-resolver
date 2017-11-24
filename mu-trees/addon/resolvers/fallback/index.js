import ClassicResolver from 'ember-resolver';
import Resolver from 'ember-resolver/resolvers/glimmer-wrapper';
import Ember from 'ember';

export default Resolver.extend({
  init(options) {
    this._super(options);
    this._fallback = ClassicResolver.create(Ember.assign({
      namespace: { modulePrefix: this.config.app.name }
    }, options));
  },
  resolve(name, referrer, rawString) {
    let result = this._super(name, referrer, rawString);
    return result || this._fallback.resolve(name);
  }
});
