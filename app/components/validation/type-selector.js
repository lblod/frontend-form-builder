import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ValidationTypeSelectorComponent extends Component {
  inputId = 'validation-type-select-' + guidFor(this);

  @tracked selectedType;
  @tracked typeOptions;

  constructor() {
    super(...arguments);

    this.selectedType = this.args.validationType;
    this.typeOptions = this.args.typeOptions ?? [];
  }

  @action
  updatedSelectedValidation(newValidationType) {
    this.selectedType = newValidationType;
  }
}
