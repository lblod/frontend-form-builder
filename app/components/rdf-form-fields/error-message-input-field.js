import InputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/input-field';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';

export default class ErrorMessageInputFieldComponent extends InputFieldComponent {
  inputId = 'select-' + guidFor(this);

  @tracked value = 25;
  
  @action
  updateValue() {

  }
}
