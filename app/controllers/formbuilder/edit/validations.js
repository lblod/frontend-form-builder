import Controller from '@ember/controller';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF, SKOS } from '@lblod/submission-form-helpers';
import {
  getMinimalNodeInfo,
  getPrefLabelOfNode,
} from '../../../utils/forking-store-helpers';
import { getPossibleValidationsForDisplayType } from '../../../utils/validation/helpers';
import { sortObjectsOnProperty } from '../../../utils/sort-object-on-property';
import { Namespace } from 'rdflib';

export default class FormbuilderEditValidationsController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked fields;
  @tracked selectedField;

  @tracked fieldValidations;
  @tracked validationsForFieldDisplayType;

  builderStore;

  updatePreview(ttl) {
    this.model.handleCodeChange(ttl);
  }

  setup = restartableTask(async () => {
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
    this.builderStore.parse(
      this.model.validationsTtl,
      this.metaGraph,
      'text/turtle'
    );

    this.setFields();
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
    let displayType = null;

    if (this.selectedField) {
      displayType = this.selectedField.displayType;
    }
    this.setPossibleValidationTypesForDisplayType(displayType);
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
      const validationConfig = {};
      const validation = this.builderStore.match(
        subject,
        undefined,
        undefined,
        this.model.graphs.sourceGraph
      );
      for (const tripleItem of validation) {
        const propertyName = this.propertyForUri(tripleItem.predicate.value);

        if (!propertyName) {
          continue;
        }

        validationConfig[propertyName] = {
          predicate: tripleItem.predicate,
          object: tripleItem.object,
        };
      }

      this.fieldValidations.pushObject(validationConfig);
    }
  }

  setPossibleValidationTypesForDisplayType(displayType) {
    this.validationsForFieldDisplayType = [];

    if (!displayType) {
      return;
    }

    const conceptOptions = getPossibleValidationsForDisplayType(
      displayType,
      this.builderStore,
      this.metaGraph
    );
    const conceptScheme = new Namespace(
      'http://lblod.data.gift/concept-schemes/'
    )('possibleValidations');

    const allOptions = this.builderStore
      .match(undefined, SKOS('inScheme'), conceptScheme, this.metaGraph)
      .map((t) => {
        const label = getPrefLabelOfNode(
          t.subject,
          this.builderStore,
          this.metaGraph
        );

        return { subject: t.subject, label: label && label.value };
      });

    const filteredOptions = allOptions.filter((option) => {
      return conceptOptions
        .map((concept) => concept.value)
        .includes(option.subject.value);
    });

    this.validationsForFieldDisplayType = sortObjectsOnProperty(
      filteredOptions,
      'label',
      false
    );
  }

  @action
  addEmptyValidation() {
    this.fieldValidations.pushObject({ type: null });
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
}
