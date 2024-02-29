import Component from '@glimmer/component';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';

export default class EditorBuildingViewComponent extends Component {
  @tracked mappedFormData = A([]);

  constructor() {
    super(...arguments);

    this.convertTtlToBuildingForm.perform(this.formCode);
  }

  convertTtlToBuildingForm = restartableTask(async (ttlCode) => {
    if (!ttlCode || ttlCode.trim() == '') return;

    const store = new ForkingStore();
    store.parse(ttlCode, this.graphs.sourceGraph, 'text/turtle');

    const statements = await this.getAllStatementsInStore(store);
    for (const statement of statements) {
      this.addStatementToMappedFormData(statement);
    }
    console.log(this.mappedFormData);
  });

  addStatementToMappedFormData(statement) {
    const index = this.getIndexOfStatement(statement);
    if (!this.isValidIndex(index)) {
      this.mappedFormData.pushObject({
        subject: statement.subject.value,
        statements: A([statement]),
      });
    } else {
      this.mappedFormData[index].statements.pushObject(statement);
    }
  }

  async getAllStatementsInStore(store) {
    return new Promise((resolve) => {
      const statements = store.match(
        undefined,
        undefined,
        undefined,
        this.graphs.sourceGraph
      );

      resolve(statements);
    });
  }

  isValidIndex(index) {
    return index == 0 || index !== -1;
  }

  getIndexOfStatement(statement) {
    return this.mappedFormData.findIndex(
      (item) => item.subject == statement.subject.value
    );
  }

  get formCode() {
    return this.args.formTtl;
  }

  get graphs() {
    return GRAPHS;
  }
}
