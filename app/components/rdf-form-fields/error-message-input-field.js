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
    this.loadValue();
  }

  loadValue() {
    const test = this.args.formStore.any(
      this.storeOptions.sourceNode,
      SHACL('resultMessage'),
      undefined,
      this.storeOptions.sourceGraph
    );
    if (test) {
      this.value = test;
    }
  }
  
  @action
  updateValue(e) {
    this.loadValue();

    this.value = e.target.value.trim();

    const oldValue = this.args.formStore.match(
      this.storeOptions.sourceNode,
      SHACL('resultMessage'),
      undefined,
      this.storeOptions.sourceGraph
    );

    if (this.value.length>0) {
    this.args.formStore.removeStatements(oldValue);
    super.updateValidations();
    }

    if(this.value) {
      const statement = new Statement(
        this.storeOptions.sourceNode,
        SHACL('resultMessage'),
        this.value,
        this.storeOptions.sourceGraph
      );
      this.args.formStore.addAll([statement]);
      super.updateValue(this.value);
    }
  }
}
