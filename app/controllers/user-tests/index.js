import Controller from '@ember/controller';

import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
export default class UserTestsIndexController extends Controller {
  @service store;

  sort = '-created';
  page = 0;
  size = 5;

  @tracked userTests;

  async setup() {
    const allForms = await this.store.query('user-test', {
      count: true,
    });
    this.model.meta.count = allForms.length;
    this.userTests = this.model;
  }
}
