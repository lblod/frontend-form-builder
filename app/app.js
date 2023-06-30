import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'frontend-form-builder/config/environment';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

// By default `Array.prototype._super` is enumerable which causes conflicts with rdflib.
// We can force it to be non-enumerable so everything works as expected.
// This code can be removed once the bug is fixed and released, or if we disable the prototype extensions in the app.
// More information: https://github.com/emberjs/ember.js/issues/19289
Object.defineProperty(Array.prototype, '_super', {
  enumerable: false,
});

loadInitializers(App, config.modulePrefix);
