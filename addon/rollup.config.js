import ts from 'rollup-plugin-ts';
import copy from 'rollup-plugin-copy';
import { defineConfig } from 'rollup';
import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

export default defineConfig({
  // This provides defaults that work well alongside `publicEntrypoints` below.
  // You can augment this if you need to.
  output: {
    ...addon.output(),
    sourcemap: true,
    hoistTransitiveImports: false,
  },

  plugins: [
    // These are the modules that users should be able to import from your
    // addon. Anything not listed here may get optimized away.
    addon.publicEntrypoints([
      'index.js',
      'resolver.js',
      'initializers/*.js',
      'resolvers/classic/index.js',
      'resolvers/classic/container-debug-adapter.js',
    ]),

    // These are the modules that should get reexported into the traditional
    // "app" tree. Things in here should also be in publicEntrypoints above, but
    // not everything in publicEntrypoints necessarily needs to go here.
    addon.appReexports(['initializers/*.js']),

    // This babel config should *not* apply presets or compile away ES modules.
    // It exists only to provide development niceties for you, like automatic
    // template colocation.
    //
    // By default, this will load the actual babel config from the file
    // babel.config.json.
    ts({
      transpiler: 'babel',
      browserslist: ['last 2 firefox versions', 'last 2 chrome versions'],
      tsconfig: {
        fileName: 'tsconfig.json',
        hook: (config) => ({
          ...config,
          declaration: true,
          declarationMap: true,
          declarationDir: './dist',
        }),
      },
    }),

    // Follow the V2 Addon rules about dependencies. Your code can import from
    // `dependencies` and `peerDependencies` as well as standard Ember-provided
    // package names.
    addon.dependencies(),

    // Remove leftover build artifacts when starting a new build.
    addon.clean(),

    // Copy Readme and License into published package
    copy({
      targets: [
        { src: '../README.md', dest: '.' },
        { src: '../LICENSE.md', dest: '.' },
      ],
    }),
  ],

  external: [
    // @ember/string is an Ember addon and must be treated as an external
    // dependency, or the import check will fail during addon build.
    '@ember/string',
  ],
});
