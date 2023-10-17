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
} from '../../utils/validation-helpers';
import {
  getDisplayTypeOfNode,
  getGroupingTypeOfNode,
  getRdfTypeOfNode,
  getValidationSubjectsOnNode,
} from '../../utils/forking-store-helpers';
import { showErrorToasterMessage } from '../../utils/toaster-message-helper';
import { FORM, RDF } from '../../utils/rdflib';
import { getGroupingTypeForValidation } from '../../utils/get-grouping-type-for-validation';

function byLabel(a, b) {
  const textA = a.label.toUpperCase();
  const textB = b.label.toUpperCase();
  return textA < textB ? -1 : textA > textB ? 1 : 0;
}

export default class ValidationConceptSchemeSelectorComponent extends InputFieldComponent {
  inputId = 'select-' + guidFor(this);

  @tracked selected = null;
  @tracked options = [];
  @tracked searchEnabled = true;

  @service toaster;

  fieldSubject;

  constructor() {
    super(...arguments);
    this.loadOptions();
    this.loadProvidedValue();
  }

  getFieldSubject() {
    if (!this.fieldSubject) {
      this.fieldSubject = getFirstFieldSubject(this.args.formStore);
    }

    return this.fieldSubject;
  }

  loadOptions() {
    const fieldDisplayType = getDisplayTypeOfNode(
      this.getFieldSubject(),
      this.args.formStore,
      this.args.graphs.sourceBuilderGraph
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
        const label = this.args.formStore.any(
          t.subject,
          SKOS('prefLabel'),
          undefined,
          metaGraph
        );
        return { subject: t.subject, label: label && label.value };
      });

    this.options = allOptions.filter((option) => {
      return conceptOptions
        .map((concept) => concept.value)
        .includes(option.subject.value);
    });
    this.options.sort(byLabel);
  }

  loadProvidedValue() {
    if (this.isValid) {
      const assignedRdfTypeOnSourceNode = getRdfTypeOfNode(
        this.storeOptions.sourceNode,
        this.storeOptions.store,
        this.storeOptions.sourceGraph
      );
      if (assignedRdfTypeOnSourceNode) {
        this.selected = this.options.find(
          (option) => option.subject.value == assignedRdfTypeOnSourceNode.value
        );
      }
    }
  }

  isSelectedValidationAlreadyOnField(selectedOption) {
    const validationNodes = getValidationSubjectsOnNode(
      this.getFieldSubject(),
      this.args.formStore,
      this.args.graphs.sourceGraph
    );

    for (const validationNode of validationNodes) {
      const type = getRdfTypeOfNode(
        validationNode,
        this.args.formStore,
        this.args.graphs.sourceGraph
      );

      if (type.value == selectedOption.subject.value) {
        return true;
      }
    }

    return false;
  }

  @action
  updateSelection(option) {
    this.selected = option;

    if (this.isSelectedValidationAlreadyOnField(this.selected)) {
      showErrorToasterMessage(
        this.toaster,
        `Validatie "${this.selected.label}" is duplicaat.`
      );
      this.selected = null;

      return;
    }

    this.removeValidationTypeAndGroupingFromGraph(
      this.storeOptions.sourceNode,
      this.storeOptions.store,
      this.storeOptions.sourceGraph
    );

    if (option) {
      const groupingType = getGroupingTypeForValidation(
        this.selected.subject,
        this.storeOptions.store,
        this.storeOptions.metaGraph
      );

      this.storeOptions.store.addAll([
        new Statement(
          this.storeOptions.sourceNode,
          FORM('grouping'),
          groupingType,
          this.storeOptions.sourceGraph
        ),
        new Statement(
          this.storeOptions.sourceNode,
          RDF('type'),
          option.subject,
          this.storeOptions.sourceGraph
        ),
      ]);
    }

    this.hasBeenFocused = true;
    super.updateValidations();
  }

  removeValidationTypeAndGroupingFromGraph(sourceNode, store, graph) {
    const rdfType = getRdfTypeOfNode(sourceNode, store, graph);
    const groupingType = getGroupingTypeOfNode(sourceNode, store, graph);

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
}
