import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class CodelijstenController extends Controller {
  @service features;
  @tracked scheme;

  @action updateSelectedSchemeTo(scheme) {
    this.scheme = scheme;
  }

  @action previousRoute() {
    window.history.back();
  }

  get configurationCode() {
    const jsonConfigCode = {
      conceptScheme: this.scheme.uri,
      searchEnabled: true,
    };

    return JSON.stringify(jsonConfigCode, null, 2).trim();
  }
}
