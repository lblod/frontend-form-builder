import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { SHACL, SKOS } from '@lblod/submission-form-helpers';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { restartableTask, timeout } from 'ember-concurrency';
import { getPossibleValidationsForDisplayType } from '../../utils/validation/helpers';
import { Namespace } from 'rdflib';
import { getPrefLabelOfNode } from '../../utils/forking-store-helpers';
import { sortObjectsOnProperty } from '../../utils/sort-object-on-property';

export default class ValidationCardComponent extends Component {
  inputId = 'validation-card' + guidFor(this);

  @tracked validation;
  @tracked validationTypes;

  @tracked defaultErrorMessage;

  metaStore;

  constructor() {
    super(...arguments);

    this.validation = this.args.validation;
    this.setup.perform();
  }

  getDefaultErrorMessage() {
    let message = '';
    if (this.validationType) {
      const messageLiteral = this.metaStore.any(
        this.validationType,
        SHACL('resultMessage'),
        undefined,
        this.metaGraph
      );

      if (messageLiteral) {
        message = messageLiteral.value;
      }
    }
    return message;
  }

  @action
  deleteValidation() {
    console.log(`delete validation`);
  }

  updateType = restartableTask(async (config) => {
    // for updating the data in the child components
    await timeout(1);
    const { type } = config;

    if (type) {
      this.validation.type.object = type.subject;
      this.defaultErrorMessage = this.getDefaultErrorMessage();
      this.validation.resultMessage.object.value = this.defaultErrorMessage;
    }
  });

  updateValidation = restartableTask(async (config) => {
    console.log(`update validation`, config);
  });

  setup = restartableTask(async () => {
    this.metaStore = new ForkingStore();
    this.metaStore.parse(this.args.metaTtl, this.metaGraph, 'text/turtle');
    this.setValidationTypes();
    this.defaultErrorMessage = this.getDefaultErrorMessage();
  });

  setValidationTypes() {
    this.validationTypes = [];

    if (!this.fieldDisplayType) {
      return;
    }

    const conceptOptions = getPossibleValidationsForDisplayType(
      this.fieldDisplayType,
      this.metaStore,
      this.metaGraph
    );

    const conceptScheme = new Namespace(
      'http://lblod.data.gift/concept-schemes/'
    )('possibleValidations');

    const allOptions = this.metaStore
      .match(undefined, SKOS('inScheme'), conceptScheme, this.metaGraph)
      .map((t) => {
        const label = getPrefLabelOfNode(
          t.subject,
          this.metaStore,
          this.metaGraph
        );

        return { subject: t.subject, label: label && label.value };
      });

    const filteredOptions = allOptions.filter((option) => {
      return conceptOptions
        .map((concept) => concept.value)
        .includes(option.subject.value);
    });

    this.validationTypes = sortObjectsOnProperty(
      filteredOptions,
      'label',
      false
    );
  }

  get metaGraph() {
    return this.args.graph;
  }

  get fieldDisplayType() {
    return this.args.fieldType;
  }

  get validationType() {
    return this.validation.type.object;
  }
}
