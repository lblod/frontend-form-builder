import SimpleInputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/simple-value-input-field';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { SHACL, RDF } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';
import { getDefaultErrorMessageForValidation } from '../../utils/validation/get-default-error-message-for-validation';

export default class ErrorMessageInputFieldComponent extends SimpleInputFieldComponent {
  inputId = 'select-' + guidFor(this);

  @tracked value;
  @tracked useDefaultMessage = true;
  @service features;

  constructor() {
    super(...arguments);
    this.checkForDefaultMessage();
  }

  @action
  updateValue(e) {
    this.value = e.target.value.trim();
    if (this.value) {
      const messageToForm = new Statement(
        this.storeOptions.sourceNode,
        SHACL('resultMessage'),
        this.value,
        this.storeOptions.sourceGraph
      );
      this.removeOldMessage();
      this.args.formStore.addAll([messageToForm]);
    } else {
      this.removeOldMessage();
    }
  }

  @action
  toggle() {
    this.useDefaultMessage = !this.useDefaultMessage;
    this.removeOldMessage();
    if (this.useDefaultMessage) {
      const selectedValidationType = this.args.formStore.any(
        this.storeOptions.sourceNode,
        RDF('type'),
        undefined,
        this.storeOptions.sourceGraph
      );
      if (selectedValidationType) {
        const defaultErrorMessage = getDefaultErrorMessageForValidation(
          selectedValidationType,
          this.storeOptions.store,
          this.storeOptions.metaGraph
        );

        if (defaultErrorMessage) {
          this.value = defaultErrorMessage;
          const statement = this.createStatementForDefaultErrorMessage(
            this.storeOptions.sourceNode,
            defaultErrorMessage,
            this.storeOptions.sourceGraph
          );
          this.storeOptions.store.addAll([statement]);
        }
      }
    } else {
      this.value = '';
    }
  }

  removeOldMessage() {
    const oldErrorMessage = this.args.formStore.match(
      this.storeOptions.sourceNode,
      SHACL('resultMessage'),
      undefined,
      this.storeOptions.sourceGraph
    );
    if (oldErrorMessage) {
      this.args.formStore.removeStatements(oldErrorMessage);
    }
  }

  createStatementForDefaultErrorMessage(
    sourceNode,
    defaultErrorMessage,
    graph
  ) {
    if (defaultErrorMessage) {
      return new Statement(
        sourceNode,
        SHACL('resultMessage'),
        defaultErrorMessage,
        graph
      );
    }
  }

  checkForDefaultMessage() {
    const defaultMessages = this.storeOptions.store
      .match(
        undefined,
        SHACL('resultMessage'),
        undefined,
        this.storeOptions.metaGraph
      )
      .map((item) => item.object.value);
    if (defaultMessages.includes(this.value)) {
      this.useDefaultMessage = true;
    } else {
      this.useDefaultMessage = false;
    }
  }

  get toggleMessage() {
    if (this.useDefaultMessage) {
      return 'Toggle om een aangepaste foutmelding te gebruiken.';
    } else {
      return 'Toggle om een standaard foutmelding te gebruiken.';
    }
  }
}
