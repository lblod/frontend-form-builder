import Controller from '@ember/controller';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../edit';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
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

  @action
  toggleFilter(filter) {
    const filterIndex = this.availableFilters.findIndex(
      (item) => item.label == filter.label
    );
    if (!filterIndex || filterIndex == -1) {
      throw `Could not find filter (${filter.label})`;
    }

    const currentActiveState = this.availableFilters[filterIndex].isActive;
    set(this.availableFilters[filterIndex], 'isActive', !currentActiveState);
  }

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
    if (object.value == FORM('Scope').value) {
      const scopeTag = this.filterTags.scope;
      this.addTagToFilters(scopeTag);

      return scopeTag;
    }
    if (object.value == FORM('ListingTable').value) {
      const tableTag = this.filterTags.table;
      this.addTagToFilters(tableTag);

      return tableTag;
    }
    if (object.value == FORM('Listing').value) {
      const listingTag = this.filterTags.listing;
      this.addTagToFilters(listingTag);

      return listingTag;
    }
    if (object.value == FORM('SubForm').value) {
      const subformTag = this.filterTags.subform;
      this.addTagToFilters(subformTag);

      return subformTag;
    }

    return null;
  }

  addTagToFilters(tag) {
    if (!Object.values(this.filterTags).includes(tag)) {
      throw `Filter tag is not recognized: (${tag})`;
    }

    if (!this.availableFilters.some((filter) => filter.label == tag)) {
      this.availableFilters.pushObject({
        isActive: true,
        skin: this.filterStyle.active.skin,
        label: tag,
        icon: this.filterStyle.active.icon,
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
      subform: 'Sub-form',
      field: 'Field',
      table: 'Table',
      listing: 'Listing',
      validation: 'Validation',
      generator: 'Generator',
      scope: 'Scope',
    };
  }

  get filterStyle() {
    return {
      active: {
        skin: 'link',
        icon: 'check',
      },
      inactive: {
        skin: 'border',
        icon: 'cross',
      },
    };
  }
}
