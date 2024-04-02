import Controller from '@ember/controller';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { enqueueTask, restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF, SKOS, SHACL } from '@lblod/submission-form-helpers';
import {
  getMinimalNodeInfo,
  getPrefLabelOfNode,
} from '../../../utils/forking-store-helpers';
import { BlankNode, Namespace, Statement } from 'rdflib';
import { sortObjectsOnProperty } from '../../../utils/sort-object-on-property';

export default class FormbuilderEditValidationsController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked fields;
  @tracked selectedField;

  @tracked fieldValidations;
  @tracked validationsForFieldDisplayType;

  @tracked countryCodeOptions;

  builderStore;

  updatePreview(ttl) {
    this.model.handleCodeChange(ttl);
  }

  setup = restartableTask(async () => {
    this.selectedField = null;
    this.fields = A([]);
    this.fieldValidations = A([]);
    this.validationsForFieldDisplayType = [];
    const formTtl = this.formCodeManager.getTtlOfLatestVersion();
    this.builderStore = new ForkingStore();
    this.builderStore.parse(
      formTtl,
      this.model.graphs.sourceGraph,
      'text/turtle'
    );

    this.setFields();
    this.countryCodeOptions = this.getCountryCodeOptions();
  });

  updateValidations = enqueueTask(async (validation) => {
    if (!validation.path) {
      validation.path = {
        object: this.selectedField.path,
        predicate: SHACL('path'),
      };
    }

    const propertiestoIgnore = ['subject', 'order'];
    if (!validation.subject) {
      const newBlankNode = new BlankNode();
      const statements = [];
      for (const property of Object.keys(validation)) {
        statements.push(
          new Statement(
            newBlankNode,
            validation[property].predicate,
            validation[property].object,
            this.sourceGraph
          )
        );
      }
      const statementLinkToField = new Statement(
        this.selectedField.subject,
        FORM('validatedBy'),
        newBlankNode,
        this.sourceGraph
      );
      this.builderStore.addAll([statementLinkToField, ...statements]);
      this.setSelectedFieldValidations();
    } else {
      const statementsToAdd = [];
      const statementsToRemove = [];
      for (const property of Object.keys(validation)) {
        if (propertiestoIgnore.includes(property)) {
          continue;
        }

        const validationProperty = validation[property];
        const currentPredicateObject = this.builderStore.any(
          validation.subject,
          validationProperty.predicate,
          undefined,
          this.sourceGraph
        );

        if (
          currentPredicateObject &&
          currentPredicateObject.value == validationProperty.object.value
        ) {
          continue;
        }

        if (currentPredicateObject) {
          const triplesToRemove = this.builderStore.match(
            validation.subject,
            validationProperty.predicate,
            undefined,
            this.sourceGraph
          );

          if (triplesToRemove) {
            statementsToRemove.push(...triplesToRemove);
          }
        }

        const newTriple = new Statement(
          validation.subject,
          validationProperty.predicate,
          validationProperty.object,
          this.sourceGraph
        );

        statementsToAdd.push(newTriple);
      }

      this.builderStore.removeStatements(statementsToRemove);
      this.builderStore.addAll(statementsToAdd);
    }

    await this.updatedTtlCodeInManager.perform();
  });

  setFields() {
    if (!this.builderStore) {
      return;
    }

    const fieldSubjects = this.builderStore
      .match(
        undefined,
        RDF('type'),
        FORM('Field'),
        this.model.graphs.sourceGraph
      )
      .map((triple) => triple.subject);

    for (const subject of fieldSubjects) {
      const field = getMinimalNodeInfo(
        subject,
        this.builderStore,
        this.model.graphs.sourceGraph
      );

      this.fields.pushObject(field);
    }
  }

  @action
  setSelectedField(field) {
    this.selectedField = field;

    this.setSelectedFieldValidations();
  }

  setSelectedFieldValidations() {
    this.fieldValidations = A([]);

    if (!this.builderStore || !this.selectedField) {
      return;
    }

    const validationBlankNodes = this.builderStore
      .match(
        this.selectedField.subject,
        FORM('validatedBy'),
        undefined,
        this.model.graphs.sourceGraph
      )
      .map((triple) => triple.object);

    for (const subject of validationBlankNodes) {
      const validation = this.builderStore.match(
        subject,
        undefined,
        undefined,
        this.model.graphs.sourceGraph
      );

      let validationConfig = this.validationStatementsToConfigObject(
        validation,
        {}
      );

      this.fieldValidations.pushObject(validationConfig);
    }
  }

  validationStatementsToConfigObject(validationStatements, validation) {
    validation.subject = validationStatements[0].subject;
    for (const tripleItem of validationStatements) {
      const propertyName = this.propertyForUri(tripleItem.predicate.value);

      if (!propertyName) {
        continue;
      }

      validation[propertyName] = {
        predicate: tripleItem.predicate,
        object: tripleItem.object,
      };
    }

    return validation;
  }

  deleteValidationFromField = enqueueTask(async (validation) => {
    const validationToRemove = this.fieldValidations.find(
      (config) => config == validation
    );

    if (validationToRemove && validation.subject) {
      const validationOfField = this.builderStore.match(
        this.selectedField.subject,
        FORM('validatedBy'),
        validationToRemove.subject,
        this.model.graphs.sourceGraph
      );
      const blankNodeToRemove = this.builderStore.match(
        validationToRemove.subject,
        undefined,
        undefined,
        this.model.graphs.sourceGraph
      );

      this.builderStore.removeStatements([
        ...blankNodeToRemove,
        ...validationOfField,
      ]);

      await this.updatedTtlCodeInManager.perform();
    }

    this.fieldValidations.removeObject(validationToRemove);
  });

  @action
  addEmptyValidation() {
    this.fieldValidations.pushObject({ type: null });
  }

  getCountryCodeOptions() {
    const conceptScheme = new Namespace(
      'http://lblod.data.gift/concept-schemes/'
    )('countryCodes');

    const metaStore = new ForkingStore();
    metaStore.parse(this.metaTtl, this.metaGraph, 'text/turtle');

    const codeOptions = metaStore
      .match(undefined, SKOS('inScheme'), conceptScheme, this.metaGraph)
      .map((t) => {
        const label = getPrefLabelOfNode(t.subject, metaStore, this.metaGraph);

        return { label: label && label.value };
      });

    return sortObjectsOnProperty(codeOptions, 'label');
  }

  propertyForUri(uri) {
    const mapping = {
      ['http://www.w3.org/ns/shacl#path']: 'path',
      ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type']: 'type',
      ['http://www.w3.org/ns/shacl#order']: 'order',
      ['http://lblod.data.gift/vocabularies/forms/grouping']: 'grouping',
      ['http://www.w3.org/ns/shacl#resultMessage']: 'resultMessage',
      ['http://lblod.data.gift/vocabularies/forms/max']: 'max',
      ['http://lblod.data.gift/vocabularies/forms/customValue']: 'customValue',
      ['http://lblod.data.gift/vocabularies/forms/customParameter']:
        'customParameter',
      ['http://lblod.data.gift/vocabularies/forms/defaultCountry']:
        'countryCode',
    };

    return mapping[uri] ?? null;
  }

  get metaGraph() {
    return this.model.graphs.metaGraph;
  }

  get sourceGraph() {
    return this.model.graphs.sourceGraph;
  }

  get metaTtl() {
    return this.model.validationsTtl;
  }

  get appliedValidations() {
    return this.fieldValidations.map((validation) => validation.type);
  }

  updatedTtlCodeInManager = restartableTask(async () => {
    const sourceTtl = this.builderStore.serializeDataMergedGraph(
      this.model.graphs.sourceGraph
    );

    this.model.handleCodeChange(sourceTtl);
  });
}
