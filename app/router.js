import EmberRouter from '@ember/routing/router';
import config from 'frontend-poc-form-builder/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('forms', function() {
    this.route('playground');
  });
});
