import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ValidationTypeSelectorComponent extends Component {
  inputId = 'validation-type-select-' + guidFor(this);

  @tracked selectedType;
  @tracked typeOptions;
  @tracked isDisabled;

  constructor() {
    super(...arguments);

    this.isDisabled = false;
    this.typeOptions = this.args.typeOptions ?? [];
    if (this.args.validationType) {
      const selectedvalidationUri = this.args.validationType.object.value;
      const validationOption = this.typeOptions.find(
        (option) => option.subject.value == selectedvalidationUri
      );
      if (validationOption) {
        this.selectedType = validationOption;
        this.isDisabled = true;
      }
    }
  }

  @action
  updatedSelectedValidation(newValidationType) {
    this.selectedType = newValidationType;
    this.isDisabled = true;
  }
}
