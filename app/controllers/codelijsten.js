import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CodelijstenController extends Controller {
  @tracked scheme;

  @action update(scheme) {
    this.scheme = scheme;
  }

  @action previousRoute() {
    window.history.back();
  }

  setup() {
    this.scheme = null;
  }

  get configurationCode() {
    const jsonConfigCode = {
      conceptScheme: this.scheme.uri,
      searchEnabled: true,
    };

    return JSON.stringify(jsonConfigCode, null, 2).trim();
  }
}
