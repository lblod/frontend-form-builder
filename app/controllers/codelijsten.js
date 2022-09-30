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
}
