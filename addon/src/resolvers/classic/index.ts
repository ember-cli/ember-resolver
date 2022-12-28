/* eslint-disable ember/no-classic-classes */
declare const requirejs: {
  entries?: Record<string, unknown>;
  _eak_seen?: Record<string, unknown>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function require(id: string): any;

import Ember from 'ember';
import { assert, deprecate, warn } from '@ember/debug';
import EmberObject from '@ember/object';
import { dasherize, classify, underscore } from '@ember/string';
import { DEBUG } from '@glimmer/env';
import classFactory from '../../utils/class-factory';
import type { Factory, FullName, KnownForTypeResult } from '@ember/owner';
import { EmberClassConstructor } from '@ember/object/-private/types';
import { Resolver as ResolverContract } from '@ember/owner';

export type Namespace = Record<string, string> & {
  modulePrefix: string;
  podModulePrefix?: string;
};

type ParsedName = {
  parsedName: true;
  fullName: FullName;
  prefix: string;
  type: string;
  fullNameWithoutType: string;
  name: string;
  root: Namespace;
  resolveMethodName: string;
};

interface ClassicResolver extends EmberObject, Required<ResolverContract> {
  [m: string]: unknown | (() => unknown);

  _camelCaseHelperWarnedNames: string[];
  _moduleRegistry: ModuleRegistry;
  _normalizeCache: Record<string, FullName>;
  _deprecatedPodModulePrefix: boolean;
  pluralizedTypes: Record<string, string>;
  namespace: Namespace;
  moduleBasedResolver: boolean;
  moduleNameLookupPatterns: ((parsedName: ParsedName) => string | undefined)[];

  _extractDefaultExport(normalizedModuleName: string): object | undefined;
  _logLookup(
    found: string | undefined,
    parsedName: ParsedName,
    description: string | undefined
  ): void;
  _normalize(fullName: FullName): FullName;
  chooseModuleName(
    moduleName: string,
    parsedName: ParsedName
  ): string | undefined;
  defaultModuleName(parsedName: ParsedName): string;
  findModuleName(
    parsedName: ParsedName,
    loggingDisabled?: boolean
  ): string | undefined;
  knownForType<TypeName extends string>(
    type: TypeName
  ): KnownForTypeResult<TypeName>;
  lookupDescription(fullName: FullName | ParsedName): string;
  makeToString(factory: Factory<object>, fullName: FullName): string;
  mainModuleName(parsedName: ParsedName): string | undefined;
  nestedColocationComponentModuleName(
    parsedName: ParsedName
  ): string | undefined;
  normalize(fullName: FullName): FullName;
  parseName: typeof parseName;
  pluralize(type: string): string;
  podBasedComponentsInSubdir(parsedName: ParsedName): string | undefined;
  podBasedLookupWithPrefix(podPrefix: string, parsedName: ParsedName): string;
  podBasedModuleName(parsedName: ParsedName): string;
  prefix({ type }: { type: string }): string;
  resolve(name: string): Factory<object> | object | undefined;
  resolveOther(parsedName: ParsedName): unknown;
  shouldWrapInClassFactory(
    defaultExport: unknown,
    parsedName: ParsedName
  ): boolean;
  translateToContainerFullname(
    type: string,
    moduleName: string
  ): string | undefined;
}

if (typeof requirejs.entries === 'undefined') {
  requirejs.entries = requirejs._eak_seen;
}

export class ModuleRegistry {
  private _entries: Record<string, unknown>;

  constructor(readonly entries?: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._entries = entries || requirejs.entries!;
  }

  moduleNames(): string[] {
    return Object.keys(this._entries);
  }

  has(moduleName: string): boolean {
    return moduleName in this._entries;
  }

  get(...args: Parameters<typeof require>) {
    return require(...args);
  }
}

/**
 * This module defines a subclass of Ember.DefaultResolver that adds two
 * important features:
 *
 *  1) The resolver makes the container aware of es6 modules via the AMD
 *     output. The loader's _moduleEntries is consulted so that classes can be
 *     resolved directly via the module loader, without needing a manual
 *     `import`.
 *  2) is able to provide injections to classes that implement `extend`
 *     (as is typical with Ember).
 */

function isParsedName(fullName: FullName | ParsedName): fullName is ParsedName {
  return typeof fullName === 'object' && fullName.parsedName === true;
}

function parseName(
  this: ClassicResolver,
  fullName: FullName | ParsedName
): ParsedName {
  if (isParsedName(fullName)) {
    return fullName;
  }

  let prefix = '',
    type: string,
    name: string;
  const fullNameParts = fullName.split('@') as [string, ...string[]];

  if (fullNameParts.length === 3) {
    if (fullNameParts[0].length === 0) {
      // leading scoped namespace: `@scope/pkg@type:name`
      prefix = `@${fullNameParts[1]}`;
      const prefixParts = (fullNameParts as [string, string, string])[2].split(
        ':'
      ) as [string, ...string[]];
      type = prefixParts[0];
      name = prefixParts[1] ?? '';
    } else {
      // interweaved scoped namespace: `type:@scope/pkg@name`
      prefix = `@${fullNameParts[1]}`;
      type = fullNameParts[0].slice(0, -1);
      name = (fullNameParts as [string, string, string])[2];
    }

    if (type === 'template:components') {
      name = `components/${name}`;
      type = 'template';
    }
  } else if (fullNameParts.length === 2) {
    const prefixParts = fullNameParts[0].split(':');

    if (prefixParts.length === 2) {
      if ((prefixParts as [string, string])[1].length === 0) {
        type = (prefixParts as [string, string])[0];
        name = `@${fullNameParts[1]}`;
      } else {
        prefix = (prefixParts as [string, string])[1];
        type = (prefixParts as [string, string])[0];
        name = (fullNameParts as [string, string])[1];
      }
    } else {
      const nameParts = (fullNameParts as [string, string])[1].split(':') as [
        string,
        ...string[]
      ];

      prefix = fullNameParts[0];
      type = nameParts[0];
      name = nameParts[1] ?? '';
    }

    if (type === 'template' && prefix.lastIndexOf('components/', 0) === 0) {
      name = `components/${name}`;
      prefix = prefix.slice(11);
    }
  } else {
    [type, name] = fullName.split(':') as [string, string];
  }

  const fullNameWithoutType = name;
  const namespace = this.namespace;
  const root = namespace;

  return {
    parsedName: true,
    fullName: fullName,
    prefix: prefix || this.prefix({ type: type }),
    type: type,
    fullNameWithoutType: fullNameWithoutType,
    name: name,
    root: root,
    resolveMethodName: 'resolve' + classify(type),
  };
}

function resolveOther(
  this: ClassicResolver,
  parsedName: ParsedName
): Factory<object> | object | undefined {
  assert('`modulePrefix` must be defined', this.namespace.modulePrefix);

  const normalizedModuleName = this.findModuleName(parsedName);

  if (normalizedModuleName) {
    let defaultExport = this._extractDefaultExport(normalizedModuleName);

    if (defaultExport === undefined) {
      throw new Error(
        ` Expected to find: '${parsedName.fullName}' within '${normalizedModuleName}' but got 'undefined'. Did you forget to 'export default' within '${normalizedModuleName}'?`
      );
    }

    if (this.shouldWrapInClassFactory(defaultExport, parsedName)) {
      defaultExport = classFactory(defaultExport);
    }

    return defaultExport;
  }
}

const Resolver = (
  EmberObject as EmberClassConstructor<ClassicResolver> & typeof EmberObject
).extend<typeof EmberObject, ClassicResolver>({
  resolveOther,
  parseName,
  pluralizedTypes: null,
  moduleRegistry: null,

  makeToString(this: ClassicResolver, _factory: unknown, fullName: FullName) {
    return '' + this.namespace.modulePrefix + '@' + fullName + ':';
  },

  shouldWrapInClassFactory(_module: unknown, _parsedName: ParsedName): boolean {
    return false;
  },

  init(this: ClassicResolver) {
    this._super();
    this.moduleBasedResolver = true;

    if (!this._moduleRegistry) {
      this._moduleRegistry = new ModuleRegistry();
    }

    this._normalizeCache = Object.create(null);

    this.pluralizedTypes = this.pluralizedTypes || Object.create(null);

    if (!this.pluralizedTypes['config']) {
      this.pluralizedTypes['config'] = 'config';
    }
    this._deprecatedPodModulePrefix = false;

    /**

     A listing of functions to test for moduleName's based on the provided
     `parsedName`. This allows easy customization of additional module based
     lookup patterns.

     @property moduleNameLookupPatterns
     @returns {Ember.Array}
    */
    this.moduleNameLookupPatterns = [
      this.podBasedModuleName,
      this.podBasedComponentsInSubdir,
      this.mainModuleName,
      this.defaultModuleName,
      this.nestedColocationComponentModuleName,
    ];
  },

  normalize(this: ClassicResolver, fullName: FullName): FullName {
    return (
      this._normalizeCache[fullName] ||
      (this._normalizeCache[fullName] = this._normalize(fullName))
    );
  },

  resolve(
    this: ClassicResolver,
    fullName: FullName | ParsedName
  ): Factory<object> | object | undefined {
    const parsedName = this.parseName(fullName);
    const resolveMethodName = parsedName.resolveMethodName;
    const resolveMethod = this[resolveMethodName];
    let resolved;

    if (typeof resolveMethod === 'function') {
      resolved = resolveMethod(parsedName);
    }

    if (resolved == null) {
      resolved = this.resolveOther(parsedName);
    }

    return resolved;
  },

  _normalize(fullName: FullName): FullName {
    // A) Convert underscores to dashes
    // B) Convert camelCase to dash-case, except for components (their
    //    templates) and helpers where we want to avoid shadowing camelCase
    //    expressions
    // C) replace `.` with `/` in order to make nested controllers work in the following cases
    //      1. `needs: ['posts/post']`
    //      2. `{{render "posts/post"}}`
    //      3. `this.render('posts/post')` from Route

    const split = fullName.split(':') as [string, string, ...string[]];
    if (split.length > 1) {
      const type = split[0];

      if (
        type === 'component' ||
        type === 'helper' ||
        type === 'modifier' ||
        (type === 'template' && split[1].indexOf('components/') === 0)
      ) {
        return `${type}:${split[1].replace(/_/g, '-')}`;
      } else {
        return `${type}:${dasherize(split[1].replace(/\./g, '/'))}`;
      }
    } else {
      return fullName;
    }
  },

  pluralize(this: ClassicResolver, type: string): string {
    return (
      this.pluralizedTypes[type] || (this.pluralizedTypes[type] = type + 's')
    );
  },

  podBasedLookupWithPrefix(podPrefix: string, parsedName: ParsedName): string {
    let fullNameWithoutType = parsedName.fullNameWithoutType;

    if (parsedName.type === 'template') {
      fullNameWithoutType = fullNameWithoutType.replace(/^components\//, '');
    }

    return podPrefix + '/' + fullNameWithoutType + '/' + parsedName.type;
  },

  podBasedModuleName(this: ClassicResolver, parsedName: ParsedName): string {
    const podPrefix =
      this.namespace.podModulePrefix || this.namespace.modulePrefix;

    return this.podBasedLookupWithPrefix(podPrefix, parsedName);
  },

  podBasedComponentsInSubdir(
    this: ClassicResolver,
    parsedName: ParsedName
  ): string | undefined {
    let podPrefix =
      this.namespace.podModulePrefix || this.namespace.modulePrefix;
    podPrefix = podPrefix + '/components';

    if (
      parsedName.type === 'component' ||
      /^components/.test(parsedName.fullNameWithoutType)
    ) {
      return this.podBasedLookupWithPrefix(podPrefix, parsedName);
    }
  },

  resolveEngine(this: ClassicResolver, parsedName: ParsedName): unknown {
    const engineName = parsedName.fullNameWithoutType;
    const engineModule = engineName + '/engine';

    if (this._moduleRegistry.has(engineModule)) {
      return this._extractDefaultExport(engineModule);
    }
  },

  resolveRouteMap(this: ClassicResolver, parsedName: ParsedName) {
    const engineName = parsedName.fullNameWithoutType;
    const engineRoutesModule = engineName + '/routes';

    if (this._moduleRegistry.has(engineRoutesModule)) {
      const routeMap = this._extractDefaultExport(engineRoutesModule);

      assert(
        `The route map for ${engineName} should be wrapped by 'buildRoutes' before exporting.`,
        typeof routeMap === 'object' &&
          routeMap !== null &&
          (routeMap as { isRouteMap?: boolean }).isRouteMap
      );

      return routeMap;
    }
  },

  resolveTemplate(this: ClassicResolver, parsedName: ParsedName): unknown {
    let resolved = this.resolveOther(parsedName);
    if (resolved == null) {
      resolved = (Ember as unknown as { TEMPLATES: Record<string, unknown> })
        .TEMPLATES[parsedName.fullNameWithoutType];
    }
    return resolved;
  },

  mainModuleName(parsedName: ParsedName): string | undefined {
    if (parsedName.fullNameWithoutType === 'main') {
      // if router:main or adapter:main look for a module with just the type first
      return parsedName.prefix + '/' + parsedName.type;
    }
  },

  defaultModuleName(this: ClassicResolver, parsedName: ParsedName): string {
    return (
      parsedName.prefix +
      '/' +
      this.pluralize(parsedName.type) +
      '/' +
      parsedName.fullNameWithoutType
    );
  },

  nestedColocationComponentModuleName(
    this: ClassicResolver,
    parsedName: ParsedName
  ): string | undefined {
    if (parsedName.type === 'component') {
      return (
        parsedName.prefix +
        '/' +
        this.pluralize(parsedName.type) +
        '/' +
        parsedName.fullNameWithoutType +
        '/index'
      );
    }
  },

  prefix(this: ClassicResolver, parsedName: { type: string }): string {
    const tmpPrefix = this.namespace.modulePrefix;
    const typePrefix = this.namespace[`${parsedName.type}Prefix`];

    return typePrefix || tmpPrefix;
  },

  findModuleName(
    this: ClassicResolver,
    parsedName: ParsedName,
    loggingDisabled?: boolean
  ): string | undefined {
    const moduleNameLookupPatterns = this.moduleNameLookupPatterns;
    let moduleName;

    for (const item of moduleNameLookupPatterns) {
      let tmpModuleName = item.call(this, parsedName);

      // allow treat all dashed and all underscored as the same thing
      // supports components with dashes and other stuff with underscores.
      if (tmpModuleName) {
        tmpModuleName = this.chooseModuleName(tmpModuleName, parsedName);
      }

      if (tmpModuleName && this._moduleRegistry.has(tmpModuleName)) {
        moduleName = tmpModuleName;
      }

      if (!loggingDisabled) {
        this._logLookup(moduleName, parsedName, tmpModuleName);
      }

      if (moduleName) {
        return moduleName;
      }
    }
  },

  chooseModuleName(
    this: ClassicResolver,
    moduleName: string,
    parsedName: ParsedName
  ): string | undefined {
    const underscoredModuleName = underscore(moduleName);

    if (
      moduleName !== underscoredModuleName &&
      this._moduleRegistry.has(moduleName) &&
      this._moduleRegistry.has(underscoredModuleName)
    ) {
      throw new TypeError(
        `Ambiguous module names: '${moduleName}' and '${underscoredModuleName}'`
      );
    }

    if (this._moduleRegistry.has(moduleName)) {
      return moduleName;
    } else if (this._moduleRegistry.has(underscoredModuleName)) {
      return underscoredModuleName;
    }
    // workaround for dasherized partials:
    // something/something/-something => something/something/_something
    const partializedModuleName = moduleName.replace(/\/-([^/]*)$/, '/_$1');

    if (this._moduleRegistry.has(partializedModuleName)) {
      deprecate(
        'Modules should not contain underscores. ' +
          'Attempted to lookup "' +
          moduleName +
          '" which ' +
          'was not found. Please rename "' +
          partializedModuleName +
          '" ' +
          'to "' +
          moduleName +
          '" instead.',
        false,
        {
          id: 'ember-resolver.underscored-modules',
          until: '3.0.0',
          for: 'ember-resolver',
          since: { available: '0.1.0' },
        }
      );

      return partializedModuleName;
    }

    if (DEBUG) {
      const isCamelCaseHelper =
        parsedName.type === 'helper' && /[a-z]+[A-Z]+/.test(moduleName);
      if (isCamelCaseHelper) {
        this._camelCaseHelperWarnedNames =
          this._camelCaseHelperWarnedNames || [];
        const alreadyWarned =
          this._camelCaseHelperWarnedNames.indexOf(parsedName.fullName) > -1;
        if (!alreadyWarned && this._moduleRegistry.has(dasherize(moduleName))) {
          this._camelCaseHelperWarnedNames.push(parsedName.fullName);
          warn(
            'Attempted to lookup "' +
              parsedName.fullName +
              '" which ' +
              'was not found. In previous versions of ember-resolver, a bug would have ' +
              'caused the module at "' +
              dasherize(moduleName) +
              '" to be ' +
              'returned for this camel case helper name. This has been fixed. ' +
              'Use the dasherized name to resolve the module that would have been ' +
              'returned in previous versions.',
            false,
            {
              id: 'ember-resolver.camelcase-helper-names',
              until: '3.0.0',
            } as never
          );
        }
      }
    }
  },

  // used by Ember.DefaultResolver.prototype._logLookup
  lookupDescription(
    this: ClassicResolver,
    fullName: FullName | ParsedName
  ): string {
    const parsedName = this.parseName(fullName);

    const moduleName = this.findModuleName(parsedName, true);

    return moduleName ?? '';
  },

  // only needed until 1.6.0-beta.2 can be required
  _logLookup(
    this: ClassicResolver,
    found: string | undefined,
    parsedName: ParsedName,
    description: string | undefined
  ): void {
    if (
      !(Ember.ENV as { LOG_MODULE_RESOLVER?: boolean }).LOG_MODULE_RESOLVER &&
      !parsedName.root['LOG_RESOLVER']
    ) {
      return;
    }

    let padding;
    const symbol = found ? '[✓]' : '[ ]';

    if (parsedName.fullName.length > 60) {
      padding = '.';
    } else {
      padding = new Array(60 - parsedName.fullName.length).join('.');
    }

    if (!description) {
      description = this.lookupDescription(parsedName);
    }

    /* eslint-disable no-console */
    if (console && console.info) {
      console.info(symbol, parsedName.fullName, padding, description);
    }
  },

  knownForType<TypeName extends string>(
    this: ClassicResolver,
    type: TypeName
  ): KnownForTypeResult<TypeName> {
    const moduleKeys = this._moduleRegistry.moduleNames();

    const items = Object.create(null);
    for (const moduleName of moduleKeys) {
      const fullname = this.translateToContainerFullname(type, moduleName);

      if (fullname) {
        items[fullname] = true;
      }
    }

    return items;
  },

  translateToContainerFullname(
    this: ClassicResolver,
    type: string,
    moduleName: string
  ): string | undefined {
    const prefix = this.prefix({ type });

    // Note: using string manipulation here rather than regexes for better performance.
    // pod modules
    // '^' + prefix + '/(.+)/' + type + '$'
    const podPrefix = prefix + '/';
    const podSuffix = '/' + type;
    const start = moduleName.indexOf(podPrefix);
    const end = moduleName.indexOf(podSuffix);

    if (
      start === 0 &&
      end === moduleName.length - podSuffix.length &&
      moduleName.length > podPrefix.length + podSuffix.length
    ) {
      return type + ':' + moduleName.slice(start + podPrefix.length, end);
    }

    // non-pod modules
    // '^' + prefix + '/' + pluralizedType + '/(.+)$'
    const pluralizedType = this.pluralize(type);
    const nonPodPrefix = prefix + '/' + pluralizedType + '/';

    if (
      moduleName.indexOf(nonPodPrefix) === 0 &&
      moduleName.length > nonPodPrefix.length
    ) {
      return type + ':' + moduleName.slice(nonPodPrefix.length);
    }
  },

  _extractDefaultExport(
    this: ClassicResolver,
    normalizedModuleName: string
  ): object | undefined {
    let module = this._moduleRegistry.get(normalizedModuleName);

    if (module && module['default']) {
      module = module['default'];
    }

    return module;
  },
});

Resolver.reopenClass({
  moduleBasedResolver: true,
});

export default Resolver;
