import SimpleInputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/simple-value-input-field';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { SHACL } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';

export default class ErrorMessageInputFieldComponent extends SimpleInputFieldComponent {
  inputId = 'select-' + guidFor(this);

  @tracked value;

  constructor() {
    super(...arguments);
  }

  @action
  updateValue(e) {
    let newErrorMessage = e.target.value.trim();
    const oldErrorMessage = this.args.formStore.match(
      this.storeOptions.sourceNode,
      SHACL('resultMessage'),
      undefined,
      this.storeOptions.sourceGraph
    );
    
    if (newErrorMessage.length > 0) {
      this.value = newErrorMessage;

      if (oldErrorMessage) {
        this.args.formStore.removeStatements(oldErrorMessage);
      }
    } else {
      const errorMessageInForm = this.args.formStore.any(
        this.storeOptions.sourceNode,
        SHACL('resultMessage'),
        undefined,
        this.storeOptions.sourceGraph
      );
      if (errorMessageInForm){
      this.value = errorMessageInForm;
      }
    }

    if (this.value) {
      const messageToForm = new Statement(
        this.storeOptions.sourceNode,
        SHACL('resultMessage'),
        this.value,
        this.storeOptions.sourceGraph
      );
      this.args.formStore.addAll([messageToForm]);
    }
  }
}
