import Component from '@glimmer/component';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import {
  parseStoreGraphs,
  validationGraphs,
} from '../utils/validation/helpers';
import { showErrorToasterMessage } from '../utils/toaster-message-helper';
import { getFieldsInStore } from '../utils/get-triples-per-field-in-store';
import { createStoreForFieldData } from '../utils/create-store-for-field';
import { addValidationTriplesToFormNodesL } from '../utils/validation/add-field-valdiations-to-formNodesL';
import { getFieldAndValidationTriples } from '../utils/get-field-and-validation-triples';
import { areValidationsInGraphValidated } from '../utils/validation/are-validations-in-graph-validated';
import { createFieldDataForSubject } from '../utils/create-field-data-for-subject';
import { getTtlWithDuplicateValidationsRemoved } from '../utils/clean-up-ttl/remove-all-duplicate-validations';

export default class AddValidationsToFormComponent extends Component {
  @tracked fields;

  @service intl;
  @service toaster;
  @tracked selectedField;
  @service('form-code-manager') formCodeManager;

  builderStore;
  savedBuilderTtlCode;

  graphs = validationGraphs;

  constructor() {
    super(...arguments);

    if (!this.args.builderTtlCode || this.args.builderTtlCode == '') {
      const errorMessage = this.intl.t(
        'messages.error.cannotAddValidationsToEmptyForm'
      );
      showErrorToasterMessage(this.toaster, errorMessage);

      throw errorMessage;
    }
    this.fields = [];
    this.savedBuilderTtlCode = this.args.builderTtlCode;

    this.initialise.perform({ ttlCode: this.savedBuilderTtlCode });
  }

  @task({ restartable: false })
  *initialise({ ttlCode }) {
    this.builderStore = new ForkingStore();
    yield parseStoreGraphs(this.builderStore, ttlCode);

    this.fields = this.createFieldArray(this.builderStore);
    this.fields.length >= 1
      ? this.setSelectedField({
          name: this.fields[0].name,
          subject: this.fields[0].subject,
        })
      : null;
  }

  @action
  async setSelectedField(field) {
    this.selectedField = null;

    if (field == null) {
      return;
    }

    const fieldData = await createStoreForFieldData(
      createFieldDataForSubject(field.subject, {
        store: this.builderStore,
        graph: this.graphs.sourceGraph,
      }),
      this.graphs
    );

    addValidationTriplesToFormNodesL(
      fieldData.subject,
      fieldData.store,
      this.graphs
    );

    this.selectedField = fieldData;
  }

  @action
  updateTtlCodeWithField({ fieldSubject, triples }) {
    const builderStoreTriples = getFieldAndValidationTriples(
      fieldSubject,
      this.builderStore,
      this.graphs.sourceGraph
    );

    this.builderStore.removeStatements(builderStoreTriples);
    this.builderStore.addAll(triples);

    const newBuilderForm = this.builderStore.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );

    if (this.formCodeManager.isTtlTheSameAsLatest(newBuilderForm)) {
      return;
    }

    if (
      areValidationsInGraphValidated(this.builderStore, this.graphs.sourceGraph)
    ) {
      const ttlWithoutDuplicateValidations =
        getTtlWithDuplicateValidationsRemoved(newBuilderForm);
      this.args.onNewBuilderForm(ttlWithoutDuplicateValidations);
      this.savedBuilderTtlCode = ttlWithoutDuplicateValidations;
    }
  }

  createFieldArray(store) {
    const fieldsData = getFieldsInStore(store, this.graphs.sourceGraph);
    const fields = [];

    for (const field of fieldsData) {
      fields.push({
        name: field.name,
        subject: field.subject,
      });
    }

    return fields;
  }
}
