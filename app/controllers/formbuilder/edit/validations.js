import Controller from '@ember/controller';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { enqueueTask, restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '@lblod/submission-form-helpers';
import { getMinimalNodeInfo } from '../../../utils/forking-store-helpers';

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
  });

  updateValidations = enqueueTask(async (config) => {
    console.log(`update validations in ttl `, config);
    // const { resultMessage } = config;

    // if (resultMessage) {
    //   const currentResultMessages = this.builderStore.match(
    //     resultMessage.subject,
    //     SHACL('resultMessage'),
    //     undefined,
    //     this.model.graphs.sourceGraph
    //   );
    //   if (currentResultMessages) {
    //     this.builderStore.removeStatements(currentResultMessages);
    //   }

    //   const newResultMessage = new Statement(
    //     resultMessage.subject,
    //     SHACL('resultMessage'),
    //     resultMessage.message,
    //     this.model.graphs.sourceGraph
    //   );

    //   this.builderStore.addAll([newResultMessage]);
    //   this.updatedTtlCodeInManager();
    // }
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
    console.log(`field`, field);

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

  validationStatementsToConfigObject(validationStatements, config) {
    config.subject = validationStatements[0].subject;
    for (const tripleItem of validationStatements) {
      const propertyName = this.propertyForUri(tripleItem.predicate.value);

      if (!propertyName) {
        continue;
      }

      config[propertyName] = {
        predicate: tripleItem.predicate,
        object: tripleItem.object,
      };
    }

    return config;
  }

  @action
  deleteValidationFromField(validation) {
    const validationToRemove = this.fieldValidations.find(
      (config) => config == validation
    );

    if (validationToRemove) {
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
        ...validationOfField,
        ...blankNodeToRemove,
      ]);
      this.updatedTtlCodeInManager();
      this.fieldValidations.removeObject(validationToRemove);
    }
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

  get metaTtl() {
    return this.model.validationsTtl;
  }

  updatedTtlCodeInManager() {
    const sourceTtl = this.builderStore.serializeDataMergedGraph(
      this.model.graphs.sourceGraph
    );
    this.model.handleCodeChange(sourceTtl);
  }
}
