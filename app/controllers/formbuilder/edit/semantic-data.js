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
  @tracked filteredDataset = A([]);
  @tracked availableFilters = A([]);

  fullDataset = null;

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

      const index = this.filteredDataset.findIndex(
        (item) => item.subject == st.subject.value
      );
      if (!index || index == -1) {
        this.filteredDataset.pushObject({
          subject: st.subject.value,
          values: A([value]),
          tags: A([]),
        });
      } else {
        this.filteredDataset[index].values.pushObject(value);
      }

      if (this.isRdfTypePredicate(st)) {
        const tag = this.getTagForType(st.object);

        if (tag) {
          const index = this.filteredDataset.findIndex(
            (item) => item.subject == st.subject.value
          );
          this.filteredDataset[index].tags.pushObject(tag);
        }
      }
    }
    this.fullDataset = this.filteredDataset;
  });

  @action
  toggleFilter(filter) {
    const filterIndex = this.availableFilters.findIndex(
      (item) => item.label == filter.label
    );

    if (filterIndex == null || filterIndex == undefined || filterIndex == -1) {
      throw `Could not find filter (${filter.label})`;
    }

    const currentActiveState = this.availableFilters[filterIndex].isActive;
    set(this.availableFilters[filterIndex], 'isActive', !currentActiveState);
    this.updateFilteredData();
  }

  getTagForType(object) {
    if (this.sectionUris.includes(object.value)) {
      const sectionTag = this.filterTags.section;
      this.addTagToFilters(sectionTag);

      return sectionTag;
    }

    if (this.validationUris.includes(object.value)) {
      const validationTag = this.filterTags.validation;
      this.addTagToFilters(validationTag);

      return validationTag;
    }

    const tagForType = {
      [FORM('Field').value]: this.filterTags.field,
      [FORM('Scope').value]: this.filterTags.scope,
      [FORM('ListingTable').value]: this.filterTags.table,
      [FORM('Listing').value]: this.filterTags.listing,
      [FORM('SubForm').value]: this.filterTags.subform,
    };

    const tag = tagForType[object.value];

    if (tag) {
      this.addTagToFilters(tag);
      return tag;
    }

    return null;
  }

  addTagToFilters(tag) {
    if (!tag) {
      return;
    }

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
    this.availableFilters = A([]);
    this.mapFormData.perform(model.ttlCode);
  }

  updateFilteredData() {
    this.filteredDataset = this.fullDataset.filter((item) => {
      const canShow = item.tags.toArray().some((tag) => {
        if (this.activeFilterLabelsAsArray.includes(tag)) {
          return true;
        } else {
          return false;
        }
      });
      if (!canShow) {
        return null;
      }

      return item;
    });
  }

  get activeFilterLabelsAsArray() {
    return this.availableFilters
      .filter((filter) => filter.isActive)
      .map((filter) => filter.label);
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
        skin: 'success',
        icon: 'check',
      },
      inactive: {
        skin: 'border',
        icon: 'cross',
      },
    };
  }

  get sectionUris() {
    return [FORM('Section').value, FORM('PropertyGroup').value];
  }

  get validationUris() {
    return [
      FORM('RequiredConstraint').value,
      FORM('MaxLength').value,
      FORM('PositiveNumber').value,
      FORM('ExactValueConstraint').value,
      FORM('ValidInteger').value,
      FORM('ValidDateTime').value,
      FORM('ValidDate').value,
      FORM('ValidYear').value,
      FORM('ValidEmail').value,
      FORM('ValidPhoneNumber').value,
      FORM('ValidIBAN').value,
      FORM('ConceptSchemeConstraint').value,
      FORM('UriConstraint').value,
      FORM('Codelist').value,
    ];
  }
}
