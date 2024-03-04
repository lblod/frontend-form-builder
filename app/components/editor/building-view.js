import Component from '@glimmer/component';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { FORM, RDF } from '@lblod/submission-form-helpers';
import EditorBlocksFieldComponent from './blocks/field';

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
        type: this.componentTypes.invisible,
        statements: A([statement]),
      });
    } else {
      this.mappedFormData[index].statements.pushObject(statement);
    }

    this.assignTypeToSubject(statement);
  }

  assignTypeToSubject(statement) {
    if (this.isRdfTypePredicate(statement)) {
      const type = this.getTypeFromObjectValue(statement.object);

      if (type) {
        const index = this.getIndexOfStatement(statement);
        this.mappedFormData[index].type = type;
      }
    }
  }

  getTypeFromObjectValue(object) {
    if (this.sectionUris.includes(object.value)) {
      return this.componentTypes.section;
    }

    const typeForRdfType = {
      [FORM('Field').value]: this.componentTypes.field,
      [FORM('ListingTable').value]: this.componentTypes.table,
      [FORM('Listing').value]: this.componentTypes.listing,
      [FORM('SubForm').value]: this.componentTypes.subform,
    };

    const type = typeForRdfType[object.value];

    if (type) {
      return type;
    }

    return this.componentTypes.invisble;
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

  isRdfTypePredicate(statement) {
    if (statement.predicate.value == RDF('type').value) {
      return true;
    }
    return false;
  }

  isValidIndex(index) {
    return index == 0 || index !== -1;
  }

  getIndexOfStatement(statement) {
    return this.mappedFormData.findIndex(
      (item) => item.subject == statement.subject.value
    );
  }

  get sectionUris() {
    return [FORM('Section').value, FORM('PropertyGroup').value];
  }

  get componentTypes() {
    return {
      invisible: {
        type: 'Invisble',
        component: null,
      },
      section: {
        type: 'Section',
        component: null,
      },
      field: {
        type: 'Field',
        component: EditorBlocksFieldComponent,
      },
      listing: {
        type: 'Listing',
        component: null,
      },
      table: {
        type: 'Table',
        component: null,
      },
      subForm: {
        type: 'Sub-form',
        component: null,
      },
    };
  }

  get formCode() {
    return this.args.formTtl;
  }

  get graphs() {
    return GRAPHS;
  }
}
