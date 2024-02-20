'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const isProductionBuild = process.env.EMBER_ENV === 'production';

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    '@appuniversum/ember-appuniversum': {
      disableWormholeElement: true,
    },
    // This is required to make the `staticEmberSource` flag work
    // We should move away from ember-fetch (https://github.com/ember-cli/ember-fetch/issues/656), but some addons do still use it
    'ember-fetch': {
      preferNative: true,
      nativePromise: true,
    },
  });

  const { Webpack } = require('@embroider/webpack');

  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    // `staticEmberSource` breaks the Ember dev tools: https://github.com/embroider-build/embroider/issues/1575
    // As a workaround we only enable it for production builds so that we can still use the dev tools for local development
    // while still having a smaller bundle in production.
    staticEmberSource: isProductionBuild,
    packagerOptions: {
      webpackConfig: {
        resolve: {
          fallback: {
            crypto: false,
          },
        },
      },
    },
  });
};
