import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import InputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/input-field';
import { SKOS } from '@lblod/submission-form-helpers';
import { Statement, namedNode } from 'rdflib';
import {
  getFirstFieldSubject,
  getPossibleValidationsForDisplayType,
} from '../../utils/validation/helpers';
import {
  getPrefLabelOfNode,
  getRdfTypeOfNode,
  getValidationSubjectsOnNode,
} from '../../utils/forking-store-helpers';
import { showErrorToasterMessage } from '../../utils/toaster-message-helper';
import { FORM, RDF, SH } from '../../utils/rdflib';
import { getGroupingTypeForValidation } from '../../utils/validation/get-grouping-type-for-validation';
import { getDefaultErrorMessageForValidation } from '../../utils/validation/get-default-error-message-for-validation';

function byLabel(a, b) {
  const textA = a.label.toUpperCase();
  const textB = b.label.toUpperCase();
  return textA < textB ? -1 : textA > textB ? 1 : 0;
}

export default class ValidationConceptSchemeSelectorComponent extends InputFieldComponent {
  inputId = 'select-' + guidFor(this);

  @tracked selectedValidationType = null;
  @tracked validationTypeOptions = [];
  @tracked searchEnabled = true;

  @service toaster;
  @service intl;

  fieldSubject;

  constructor() {
    super(...arguments);
    this.loadValidationTypes();
    this.loadProvidedValidationType();
  }

  getFieldSubject() {
    if (!this.fieldSubject) {
      this.fieldSubject = getFirstFieldSubject(this.args.formStore);
    }

    return this.fieldSubject;
  }

  loadValidationTypes() {
    const fieldDisplayType = this.args.formStore.any(
      this.getFieldSubject(),
      FORM('displayType'),
      undefined,
      this.args.graphs.sourceGraph
    );

    const metaGraph = this.args.graphs.metaGraph;
    const fieldOptions = this.args.field.options;
    const conceptScheme = new namedNode(fieldOptions.conceptScheme);

    if (fieldOptions.searchEnabled !== undefined) {
      this.searchEnabled = fieldOptions.searchEnabled;
    }
    const conceptOptions = getPossibleValidationsForDisplayType(
      fieldDisplayType,
      this.args.formStore,
      this.args.graphs.fieldGraph
    );

    const allOptions = this.args.formStore
      .match(undefined, SKOS('inScheme'), conceptScheme, metaGraph)
      .map((t) => {
        const label = getPrefLabelOfNode(
          t.subject,
          this.args.formStore,
          metaGraph
        );

        return { subject: t.subject, label: label && label.value };
      });

    this.validationTypeOptions = allOptions.filter((option) => {
      return conceptOptions
        .map((concept) => concept.value)
        .includes(option.subject.value);
    });
    this.validationTypeOptions.sort(byLabel);
  }

  loadProvidedValidationType() {
    if (this.isValid) {
      const assignedRdfTypeOnSourceNode = getRdfTypeOfNode(
        this.storeOptions.sourceNode,
        this.storeOptions.store,
        this.storeOptions.sourceGraph
      );
      if (assignedRdfTypeOnSourceNode) {
        this.selectedValidationType = this.validationTypeOptions.find(
          (option) => option.subject.value == assignedRdfTypeOnSourceNode.value
        );
      }
    }
  }

  isSelectedValidationAlreadyOnField(selectedOption) {
    if (!selectedOption) {
      return false;
    }

    const validationNodes = getValidationSubjectsOnNode(
      this.getFieldSubject(),
      this.args.formStore,
      this.args.graphs.sourceGraph
    );

    for (const validationNode of validationNodes) {
      const validationType = getRdfTypeOfNode(
        validationNode,
        this.args.formStore,
        this.args.graphs.sourceGraph
      );

      if (
        validationType &&
        validationType.value == selectedOption.subject.value
      ) {
        return true;
      }
    }

    return false;
  }

  @action
  updateValidationDefaultStatements(validationTypeOption) {
    this.selectedValidationType = validationTypeOption;

    if (this.isSelectedValidationAlreadyOnField(this.selectedValidationType)) {
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('messages.error.duplicateValidationType', {
          type: this.selectedValidationType.label,
        })
      );
      this.selectedValidationType = null;

      return;
    }

    this.removeValidationTypeAndGroupingFromGraph(
      this.storeOptions.sourceNode,
      this.storeOptions.store,
      this.storeOptions.sourceGraph
    );

    const defaultErrorMessage = this.getDefaultErrorMessage(
      this.storeOptions.sourceNode,
      this.storeOptions.store,
      this.storeOptions.sourceGraph
    );

    if (validationTypeOption) {
      const groupingType = getGroupingTypeForValidation(
        this.selectedValidationType.subject,
        this.storeOptions.store,
        this.storeOptions.metaGraph
      );

      const validationPathStatement =
        this.getStatementToAddFieldPathToValidationPath(
          this.storeOptions.sourceNode,
          this.storeOptions.store,
          this.storeOptions.sourceGraph
        );

      const rdfTypeAndGroupingStatements =
        this.createStatementForRdfTypeAndGrouping(
          this.storeOptions.sourceNode,
          validationTypeOption.subject,
          groupingType,
          this.storeOptions.sourceGraph
        );
      const defaultErrorMessageStatement =
        this.createStatementForDefaultErrorMessage(
          this.storeOptions.sourceNode,
          defaultErrorMessage,
          this.storeOptions.sourceGraph
        );

      const commonStatements = [
        validationPathStatement,
        ...rdfTypeAndGroupingStatements,
      ];
      if (defaultErrorMessageStatement) {
        commonStatements.push(defaultErrorMessageStatement);
      }
      this.storeOptions.store.addAll(commonStatements);
    }

    this.hasBeenFocused = true;
    super.updateValidations();
  }

  removeValidationTypeAndGroupingFromGraph(sourceNode, store, graph) {
    const rdfType = getRdfTypeOfNode(sourceNode, store, graph);
    const groupingType = store.any(
      sourceNode,
      FORM('grouping'),
      undefined,
      graph
    );

    const statements = this.createStatementForRdfTypeAndGrouping(
      sourceNode,
      rdfType,
      groupingType,
      graph
    );

    if (rdfType && groupingType) {
      store.removeStatements(statements);
    }
  }

  getDefaultErrorMessage(sourceNode, store, graph) {
    const currentMessage = store.any(
      sourceNode,
      SH('resultMessage'),
      undefined,
      graph
    );
    if (currentMessage) {
      return;
    }

    return getDefaultErrorMessageForValidation(
      this.selectedValidationType.subject,
      this.storeOptions.store,
      this.storeOptions.metaGraph
    );
  }

  createStatementForRdfTypeAndGrouping(
    sourceNode,
    rdfType,
    groupingType,
    graph
  ) {
    return [
      new Statement(sourceNode, RDF('type'), rdfType, graph),
      new Statement(sourceNode, FORM('grouping'), groupingType, graph),
    ];
  }

  createStatementForDefaultErrorMessage(
    sourceNode,
    defaultErrorMessage,
    graph
  ) {
    if (defaultErrorMessage) {
      return new Statement(
        sourceNode,
        SH('resultMessage'),
        defaultErrorMessage,
        graph
      );
    }
  }

  getStatementToAddFieldPathToValidationPath(validationSubject, store, graph) {
    const fieldPath = store.any(
      this.getFieldSubject(),
      SH('path'),
      undefined,
      graph
    );

    return new Statement(validationSubject, SH('path'), fieldPath, graph);
  }
}
