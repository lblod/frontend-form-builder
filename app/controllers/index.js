import Controller from '@ember/controller';

import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class IndexController extends Controller {
  @service store;

  sort = '-created';
  page = 0;
  size = 5;

  @tracked generatedForms;

  async setup() {
    const allForms = await this.store.query('generated-form', {
      count: true,
    });
    this.model.meta.count = allForms.length;
    this.generatedForms = this.model;
  }
}
