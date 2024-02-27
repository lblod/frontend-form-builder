import Controller from '@ember/controller';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../edit';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { RDF, FORM } from '@lblod/submission-form-helpers';

export default class FormbuilderEditSemanticDataController extends Controller {
  model;
  @tracked data = A([]);
  @tracked availableFilters = A([]);

  mapFormData = restartableTask(async (formTtlCode) => {
    const store = new ForkingStore();
    store.parse(formTtlCode, this.graphs.sourceGraph, 'text/turtle');

    const allStatements = store.match(
      undefined,
      undefined,
      undefined,
      this.graphs.sourceGraph
    );

    for (const st of allStatements) {
      const value = { predicate: st.predicate.value, object: st.object.value };

      const index = this.data.findIndex(
        (item) => item.subject == st.subject.value
      );
      if (!index || index == -1) {
        this.data.pushObject({
          subject: st.subject.value,
          values: A([value]),
          tags: A([]),
        });
      } else {
        this.data[index].values.pushObject(value);
      }

      if (this.isRdfTypePredicate(st)) {
        const tag = this.getTagForType(st.object);

        if (tag) {
          const index = this.data.findIndex(
            (item) => item.subject == st.subject.value
          );
          this.data[index].tags.pushObject(tag);
        }
      }
    }
    console.log(this.data);
  });

  getTagForType(object) {
    const sections = [FORM('Section').value, FORM('PropertyGroup').value];

    if (sections.includes(object.value)) {
      const sectionTag = this.filterTags.section;
      this.addTagToFilters(sectionTag);

      return sectionTag;
    }
    if (object.value == FORM('Field').value) {
      const fieldTag = this.filterTags.field;
      this.addTagToFilters(fieldTag);

      return fieldTag;
    }

    return null;
  }

  addTagToFilters(tag) {
    if (!Object.values(this.filterTags).includes(tag)) {
      throw `Filter tag is not recognized: (${tag})`;
    }

    if (!this.availableFilters.some((filter) => filter.label == tag)) {
      this.availableFilters.pushObject({
        skin: this.filterSkin.active,
        label: tag,
      });
    }
  }

  isRdfTypePredicate(statement) {
    if (statement.predicate.value == RDF('type').value) {
      return true;
    }
    return false;
  }

  setup(model) {
    this.mapFormData.perform(model.ttlCode);
  }

  get graphs() {
    return GRAPHS;
  }

  get filterTags() {
    return {
      section: 'Section',
      field: 'Field',
      table: 'Table',
      validation: 'Validation',
      generator: 'Generator',
      scope: 'Scope',
    };
  }

  get filterSkin() {
    return {
      active: 'link',
      inactive: 'border',
    };
  }
}
