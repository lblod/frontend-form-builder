import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { SHACL, SKOS, RDF, FORM } from '@lblod/submission-form-helpers';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { restartableTask, timeout } from 'ember-concurrency';
import { getPossibleValidationsForDisplayType } from '../../utils/validation/helpers';
import { Literal, Namespace } from 'rdflib';
import { getPrefLabelOfNode } from '../../utils/forking-store-helpers';
import { sortObjectsOnProperty } from '../../utils/sort-object-on-property';
import { isValidationConfigValidForType } from '../../utils/validation/is-validation-config-valid-for-type.js';

export default class ValidationCardComponent extends Component {
  inputId = 'validation-card' + guidFor(this);

  @tracked validation;
  @tracked validationType;
  @tracked validationTypes;

  @tracked defaultErrorMessage;

  metaStore;

  constructor() {
    super(...arguments);

    this.validation = this.args.validation;
    this.setup.perform();
  }

  getGroupingForValidation(typeNode) {
    let grouping = FORM('grouping');
    const groupingFromMeta = this.metaStore.any(
      typeNode,
      FORM('grouping'),
      undefined,
      this.metaGraph
    );

    if (groupingFromMeta) {
      grouping = {
        object: groupingFromMeta,
        predicate: FORM('grouping'),
      };
    }

    return grouping;
  }

  getDefaultErrorMessage() {
    let message = '';
    if (this.validationType) {
      const messageLiteral = this.metaStore.any(
        this.validationType.object,
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
    this.args.delete(this.validation);
  }

  updateType = restartableTask(async (config) => {
    const { type } = config;

    if (type) {
      this.validationType = {
        object: type.subject,
        predicate: RDF('type'),
      };
      this.validation.type = this.validationType;
    }

    this.validation.grouping = this.getGroupingForValidation(type.subject);

    this.defaultErrorMessage = this.getDefaultErrorMessage();

    if (!this.validation.resultMessage) {
      this.validation.resultMessage = {
        object: new Literal(this.defaultErrorMessage),
        predicate: SHACL('resultMessage'),
      };
    } else {
      this.validation.resultMessage.object.value = this.defaultErrorMessage;
    }

    // for updating the data in the child components
    await timeout(1);
  });

  updateValidation = restartableTask(async (config) => {
    config.type = this.validationType;

    for (const property of Object.keys(config)) {
      this.validation[property] = config[property];
    }

    if (isValidationConfigValidForType(this.validation)) {
      this.args.update(this.validation);
    }
  });

  setup = restartableTask(async () => {
    this.metaStore = new ForkingStore();
    this.metaStore.parse(this.args.metaTtl, this.metaGraph, 'text/turtle');
    this.setValidationTypes();
    this.validationType = this.validation.type;
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
}
