import Application from "@ember/application";
import Resolver from "./resolver";
import loadInitializers from "ember-load-initializers";
import config from "./config/environment";

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);

// Makes Ember's type definitions visible throughout the project, thereby using
// TS to power autocomplete for all Ember types in any editor.
/**
 * @typedef {import('ember-source/types')} Stable
 * @typedef {import('ember-source/types/preview')} Preview
 */
