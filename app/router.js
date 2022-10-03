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
  this.route('codelijsten');
  this.route('formbuilder', function () {
    this.route('new');
    this.route('edit', { path: '/:id/edit' });
  });
  this.route('user-tests', function () {
    this.route('new');
    this.route('edit', { path: '/:id/edit' });
  });
});
