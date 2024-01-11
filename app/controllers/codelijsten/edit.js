import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CodelijstenEditController extends Controller {
  @tracked name;
  @tracked concepts;

  @action
  setup(model) {
    this.name = model.conceptScheme.label;
    this.concepts = new Array(...model.concepts);
    this.isGenericConceptScheme = model.isGenericConceptScheme;
    console.log(this.concepts);
  }

  get isSaveButtonDisabled() {
    return this.isGenericConceptScheme;
  }
}
