import Component from '@glimmer/component';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { FORM, RDF, SHACL } from '@lblod/submission-form-helpers';
import EditorBlocksFieldComponent from './blocks/field';
import { isNamedNode } from 'rdflib';
import EditorBlocksSectionComponent from './blocks/section';

export default class EditorBuildingViewComponent extends Component {
  @tracked mappedFormData = A([]);
  @tracked form = A([]);

  constructor() {
    super(...arguments);

    this.convertTtlToBuildingForm.perform(this.formCode);
  }

  convertTtlToBuildingForm = restartableTask(async (ttlCode) => {
    if (!ttlCode || ttlCode.trim() == '') return;

    const store = new ForkingStore();
    store.parse(ttlCode, this.graphs.sourceGraph, 'text/turtle');

    this.mappedFormData = A([]);

    const statements = await this.getAllStatementsInStore(store);
    for (const statement of statements) {
      this.addStatementToMappedFormData(statement);
    }

    this.structureForm.perform();
  });

  structureForm = restartableTask(async () => {
    const sourceNodeIndex = this.mappedFormData.findIndex(
      (item) => item.subject == this.sourceNodeValue
    );

    if (!this.isValidIndex(sourceNodeIndex)) {
      return [];
    }

    for (const node of this.mappedFormData[sourceNodeIndex].partOf) {
      console.log(`node`, node);
      const indexOfNode = this.getIndexOfSubjectValue(node.value);

      if (!this.isValidIndex(indexOfNode)) continue;

      const children = this.mappedFormData.filter((data) =>
        data.partOf.map((st) => st.value).includes(node.value)
      );

      this.form.pushObject({
        ...this.mappedFormData[indexOfNode],
        children: A(children),
      });
    }
  });

  addStatementToMappedFormData(statement) {
    const index = this.getIndexOfStatement(statement);
    if (!this.isValidIndex(index)) {
      this.mappedFormData.pushObject({
        subject: statement.subject.value,
        type: this.componentTypes.invisible,
        statements: A([statement]),
        partOf: A([]),
      });
    } else {
      this.mappedFormData[index].statements.pushObject(statement);
    }

    this.assignTypeToSubject(statement);
    this.assignAsPartOf(statement, index);
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

  assignAsPartOf(statement, subjectIndex) {
    const referencedSubject = this.getPartOfSubject(statement);
    if (referencedSubject && this.isValidIndex(subjectIndex)) {
      this.mappedFormData[subjectIndex].partOf.pushObject(statement.object);
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

    return this.componentTypes.invisible;
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

  isReferencePredicate(predicate) {
    const referencePredicates = [SHACL('group').value, FORM('partOf').value];

    return referencePredicates.includes(predicate.value);
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

  getIndexOfSubjectValue(subjectValue) {
    return this.mappedFormData.findIndex(
      (item) => item.subject == subjectValue
    );
  }

  getPartOfSubject(statement) {
    if (!isNamedNode(statement.object)) {
      return null;
    }

    if (!this.isReferencePredicate(statement.predicate)) {
      return null;
    }

    return statement.subject;
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
        component: EditorBlocksSectionComponent,
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

  get sourceNodeValue() {
    return `http://ember-submission-form-fields/source-node`;
  }
}
