import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { SHACL, SKOS, RDF, FORM } from '@lblod/submission-form-helpers';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { restartableTask, timeout } from 'ember-concurrency';
import { Literal, Namespace } from 'rdflib';
import { getPrefLabelOfNode } from '../../utils/forking-store-helpers';
import { sortObjectsOnProperty } from '../../utils/sort-object-on-property';
import { isValidationConfigValidForType } from '../../utils/validation/is-validation-config-valid-for-type.js';

const EXT = new Namespace('http://mu.semte.ch/vocabularies/ext/');

export default class ValidationCardComponent extends Component {
  inputId = 'validation-card' + guidFor(this);

  @tracked validation;
  @tracked validationType;
  @tracked validationSubject;

  @tracked validationTypes;

  @tracked defaultErrorMessage;
  @tracked isCardInError;

  metaStore;

  constructor() {
    super(...arguments);

    this.validation = this.args.validation;
    this.validationSubject = this.validation.subject;
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
    this.validation.subject = this.validationSubject;

    this.args.delete(this.validation);
  }

  updateType = restartableTask(async (validation) => {
    const { type } = validation;

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
      this.updateValidation.perform(this.validation);
    }

    // for updating the data in the child components
    await timeout(1);
  });

  updateValidation = restartableTask(async (validation) => {
    validation.type = this.validationType;

    for (const property of Object.keys(validation)) {
      this.validation[property] = validation[property];
    }

    if (isValidationConfigValidForType(this.validation)) {
      this.isCardInError = false;
      this.args.update(this.validation);
    } else {
      if (!this.isCardInError) {
        this.isCardInError = true;
      }
    }
  });

  setup = restartableTask(async () => {
    this.metaStore = new ForkingStore();
    this.metaStore.parse(this.args.metaTtl, this.metaGraph, 'text/turtle');
    this.setValidationTypes();

    if (this.validation.type) {
      this.validationType = this.validation.type;
      this.defaultErrorMessage = this.getDefaultErrorMessage();
      this.isCardInError = false;
    } else {
      this.isCardInError = true;
    }
  });

  setValidationTypes() {
    this.validationTypes = [];

    if (!this.fieldDisplayType) {
      return;
    }

    const conceptOptions = this.metaStore
      .match(
        this.fieldDisplayType,
        EXT('canHaveValidation'),
        undefined,
        this.metaGraph
      )
      .map((triple) => triple.object);

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

    const optionsForFieldType = allOptions.filter((option) => {
      return conceptOptions
        .map((concept) => concept.value)
        .includes(option.subject.value);
    });

    const itemsWithDisabledOptions = optionsForFieldType.map((option) => {
      if (this.appliedValidationTypes.includes(option.subject.value)) {
        return {
          ...option,
          disabled: true,
        };
      }

      return option;
    });

    this.validationTypes = sortObjectsOnProperty(
      itemsWithDisabledOptions,
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

  get appliedValidationTypes() {
    return this.args.appliedValidations
      .filter((validation) => validation)
      .map((validation) => validation.object.value);
  }

  get showErrorVisualization() {
    return this.isCardInError;
  }

  get isUpdatingValidations() {
    return this.args.isUpdating ?? false;
  }
}
