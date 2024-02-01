import EmberRouter from '@ember/routing/router';
import config from 'frontend-form-builder/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('forms', function () {
    this.route('playground');
  });
  this.route('codelijsten', function () {
    // commented to prevent users to still create a new codelist by changing the url
    // feature flag: CAN_CREATE_OWN_CODELIST
    this.route('new');
    this.route('edit', { path: '/:id/edit' });
  });
  this.route('formbuilder', function () {
    this.route('edit', { path: '/:id/edit' }, function () {
      this.route('code');
      this.route('builder');
      this.route('validations');
      this.route('configuration');
    });
  });
  this.route('user-tests', function () {
    this.route('new');
    this.route('edit', { path: '/:id/edit' });
  });
});
