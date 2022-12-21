/* globals requirejs */

import { warn } from '@ember/debug';
import { dasherize } from '@ember/string';
import { DEBUG } from '@glimmer/env';

import require from 'require';

export default class Resolver {
  constructor(attrs) {
    if (attrs) {
      this.namespace = attrs.namespace;
    }
    // secret handshake with router to ensure substates are enabled
    // see https://github.com/emberjs/ember.js/blob/a429dc327ee6ef97d948a83e727886c75c6fe043/packages/%40ember/-internals/routing/lib/system/router.ts#L344
    this.moduleBasedResolver = true;
  }

  static create(args) {
    return new this(args);
  }

  has(moduleName) {
    return moduleName in (requirejs.entries || requirejs._eak_seen);
  }

  parseFullName(fullName) {
    let prefix, type, name;

    let fullNameParts = fullName.split('@');

    if (fullNameParts.length === 3) {
      if (fullNameParts[0].length === 0) {
        // leading scoped namespace: `@scope/pkg@type:name`
        prefix = `@${fullNameParts[1]}`;
        let prefixParts = fullNameParts[2].split(':');
        type = prefixParts[0];
        name = prefixParts[1];
      } else {
        // interweaved scoped namespace: `type:@scope/pkg@name`
        prefix = `@${fullNameParts[1]}`;
        type = fullNameParts[0].slice(0, -1);
        name = fullNameParts[2];
      }

      if (type === 'template:components') {
        name = `components/${name}`;
        type = 'template';
      }
    } else if (fullNameParts.length === 2) {
      let prefixParts = fullNameParts[0].split(':');

      if (prefixParts.length === 2) {
        if (prefixParts[1].length === 0) {
          type = prefixParts[0];
          name = `@${fullNameParts[1]}`;
        } else {
          prefix = prefixParts[1];
          type = prefixParts[0];
          name = fullNameParts[1];
        }
      } else {
        let nameParts = fullNameParts[1].split(':');

        prefix = fullNameParts[0];
        type = nameParts[0];
        name = nameParts[1];
      }

      if (type === 'template' && prefix.lastIndexOf('components/', 0) === 0) {
        name = `components/${name}`;
        prefix = prefix.slice(11);
      }
    } else {
      fullNameParts = fullName.split(':');

      prefix = this.namespace.modulePrefix;
      type = fullNameParts[0];
      name = fullNameParts[1];
    }

    return {
      prefix,
      type,
      name
    }
  }

  moduleNameForFullName(fullName) {
    let moduleName;

    const { prefix, type, name } = this.parseFullName(fullName);

    if (name === 'main') {
      moduleName = `${prefix}/${type}`;
    } else if (type === 'engine') {
      moduleName = `${name}/engine`;
    } else if (type === 'route-map') {
      moduleName = `${name}/routes`;
    } else if (type === 'config') {
      moduleName = `${prefix}/${type}/${name.replace(/\./g, '/')}`;
    } else {
      moduleName = `${prefix}/${type}s/${name.replace(/\./g, '/')}`;
    }

    return moduleName;
  }

  resolve(fullName) {
    const moduleName = this.moduleNameForFullName(fullName);

    if (this.has(moduleName)) {
      // hit
      return require(moduleName)['default'];
    }
    // miss
  }

  normalize(fullName) {
    if(DEBUG) {
      const { type } = this.parseFullName(fullName);

      if(['service'].includes(type)) {
        warn(`Attempted to lookup "${fullName}". Use "${dasherize(fullName)}" instead.`, !fullName.match(/[a-z]+[A-Z]+/), { id: 'ember-strict-resolver.camelcase-names' });
      }
    }

    return fullName;
  }
}
