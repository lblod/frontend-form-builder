/* eslint-env node */
'use strict';

module.exports = function (deployTarget) {
  process.env.GIT_DISCOVERY_ACROSS_FILESYSTEM = 1;
  let ENV = {
    build: {
      environment: 'production',
    },
    'ssh-index': {
      // copy and deploy index.html
      username: 'root',
      host: 'poc-form-builder.relance.s.redpencil.io',
      port: 22,
      remoteDir: '/data/app-poc-form-builder/frontend-build',
      allowOverwrite: true,
      agent: process.env.SSH_AUTH_SOCK,
    },
    rsync: {
      // copy assets
      host: 'root@poc-form-builder.relance.s.redpencil.io',
      port: 22,
      dest: '/data/app-poc-form-builder/frontend-build',
      delete: false,
      arg: ['--verbose'],
    },
  };

  if (deployTarget === 'production') {
    //TODO:
  }

  // Note: if you need to build some configuration asynchronously, you can return
  // a promise that resolves with the ENV object instead of returning the
  // ENV object synchronously.
  return ENV;
};
