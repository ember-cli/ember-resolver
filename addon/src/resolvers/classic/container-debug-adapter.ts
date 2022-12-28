import { A } from '@ember/array';
import ContainerDebugAdapter from '@ember/debug/container-debug-adapter';
import { getOwner } from '@ember/application';
import ModuleRegistry from './ModuleRegistry';
import type Namespace from './Namespace';

function getPod(type: string, key: string, prefix: string): string | undefined {
  const match = key.match(new RegExp('^/?' + prefix + '/(.+)/' + type + '$'));
  if (match !== null) {
    return match[1];
  }
}

/*
 * This module defines a subclass of Ember.ContainerDebugAdapter that adds
 * support for resolving from modules.
 *
 */

interface ClassicContainerDebugAdapter extends ContainerDebugAdapter {
  _moduleRegistry: ModuleRegistry;
  namespace: Namespace;
}

/* eslint-disable ember/no-classic-classes */
export default ContainerDebugAdapter.extend({
  _moduleRegistry: null,

  init(this: ClassicContainerDebugAdapter): void {
    this._super();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.namespace = getOwner(this)!.lookup('application:main') as Namespace;

    if (!this._moduleRegistry) {
      this._moduleRegistry = new ModuleRegistry();
    }
  },

  /**
      The container of the application being debugged.
      This property will be injected
      on creation.

      @property container
      @default null
      */

  /**
      The resolver instance of the application
      being debugged. This property will be injected
      on creation.

      @property resolver
      @default null
      */

  /**
      Returns true if it is possible to catalog a list of available
      classes in the resolver for a given type.

      @method canCatalogEntriesByType
      @param {string} type The type. e.g. "model", "controller", "route"
      @return {boolean} whether a list is available for this type.
      */
  canCatalogEntriesByType(
    this: ClassicContainerDebugAdapter,
    type: string
  ): boolean {
    if (type === 'model') {
      return true;
    }
    return this._super(type);
  },

  /**
      Returns the available classes a given type.

      @method catalogEntriesByType
      @param {string} type The type. e.g. "model", "controller", "route"
      @return {Array} An array of classes.
      */
  catalogEntriesByType(
    this: ClassicContainerDebugAdapter,
    type: string
  ): string[] {
    const moduleNames = this._moduleRegistry.moduleNames();
    const types = A<string>();

    const prefix = this.namespace.modulePrefix;

    for (const key of moduleNames) {
      if (key.indexOf(type) !== -1) {
        // Check if it's a pod module
        let name = getPod(type, key, this.namespace.podModulePrefix || prefix);
        if (!name) {
          // Not pod
          name = key.split(type + 's/').pop() as string;

          // Support for different prefix (such as ember-cli addons).
          // Uncomment the code below when
          // https://github.com/ember-cli/ember-resolver/pull/80 is merged.

          //let match = key.match('^/?(.+)/' + type);
          //if (match && match[1] !== prefix) {
          // Different prefix such as an addon
          //name = match[1] + '@' + name;
          //}
        }
        types.addObject(name);
      }
    }
    return types;
  },
});
