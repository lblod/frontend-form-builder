import Controller from '@ember/controller';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../edit';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
import { A } from '@ember/array';
import { service } from '@ember/service';
import { RDF, FORM } from '@lblod/submission-form-helpers';

export default class FormbuilderEditSemanticDataController extends Controller {
  @service intl;

  @tracked filteredDataset = A([]);
  @tracked availableFilters = A([]);

  model;
  fullDataset = null;

  mapFormInputData = restartableTask(async (dataTtl) => {
    if (!dataTtl) {
      return;
    }

    const store = new ForkingStore();
    store.parse(dataTtl, this.graphs.sourceGraph, 'text/turtle');

    for (const statement of this.getAllStatementsInStore(store)) {
      this.addStatementToFilteredData(statement);

      const index = this.getIndexOfStatement(statement);

      if (this.isValidIndex(index)) {
        const inputDataTag = this.filterTags.inputData.label;
        this.addTagToFilters(inputDataTag);
        this.filteredDataset[index].tags.pushObject(inputDataTag);
      }
    }
  });

  mapFormTtl = restartableTask(async (formTtlCode) => {
    const store = new ForkingStore();
    store.parse(formTtlCode, this.graphs.sourceGraph, 'text/turtle');

    for (const statement of this.getAllStatementsInStore(store)) {
      this.addStatementToFilteredData(statement);

      if (this.isRdfTypePredicate(statement)) {
        const tag = this.getTagForType(statement.object);

        if (tag) {
          const index = this.getIndexOfStatement(statement);
          this.filteredDataset[index].tags.pushObject(tag);
        }
      }
    }
    this.fullDataset = this.filteredDataset;
  });

  addStatementToFilteredData(statement) {
    const value = {
      predicate: statement.predicate.value,
      object: statement.object.value,
    };

    const index = this.getIndexOfStatement(statement);
    if (!this.isValidIndex(index)) {
      this.filteredDataset.pushObject({
        subject: statement.subject.value,
        values: A([value]),
        tags: A([]),
      });
    } else {
      this.filteredDataset[index].values.pushObject(value);
    }
  }

  getIndexOfStatement(statement) {
    return this.filteredDataset.findIndex(
      (item) => item.subject == statement.subject.value
    );
  }

  getAllStatementsInStore(store) {
    return store.match(
      undefined,
      undefined,
      undefined,
      this.graphs.sourceGraph
    );
  }

  isValidIndex(index) {
    return index == 0 || index !== -1;
  }

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
      const sectionTag = this.filterTags.section.label;
      this.addTagToFilters(sectionTag);

      return sectionTag;
    }

    if (this.validationUris.includes(object.value)) {
      const validationTag = this.filterTags.validation.label;
      this.addTagToFilters(validationTag);

      return validationTag;
    }

    if (this.parentNodeFormUris.includes(object.value)) {
      const formTag = this.filterTags.formNode.label;
      this.addTagToFilters(formTag);

      return formTag;
    }

    const tagForType = {
      [FORM('Field').value]: this.filterTags.field.label,
      [FORM('Scope').value]: this.filterTags.scope.label,
      [FORM('ListingTable').value]: this.filterTags.table.label,
      [FORM('Listing').value]: this.filterTags.listing.label,
      [FORM('SubForm').value]: this.filterTags.subform.label,
      [FORM('Generator').value]: this.filterTags.generator.label,
    };

    const tag = tagForType[object.value];

    if (tag) {
      this.addTagToFilters(tag);
      return tag;
    }

    this.addTagToFilters(this.filterTags.unTagged.label);
    return this.filterTags.unTagged.label;
  }

  addTagToFilters(tag) {
    if (!tag) {
      return;
    }

    const filterTagLabels = Object.values(this.filterTags).map(
      (value) => value.label
    );
    if (!Object.values(filterTagLabels).includes(tag)) {
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
    this.mapFormTtl.perform(model.formTtlCode);
    this.mapFormInputData.perform(model.dataTtlCode);
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
      section: { label: this.intl.t('semanticData.filters.section') },
      subform: { label: this.intl.t('semanticData.filters.subform') },
      field: { label: this.intl.t('semanticData.filters.field') },
      table: { label: this.intl.t('semanticData.filters.table') },
      listing: { label: this.intl.t('semanticData.filters.listing') },
      validation: {
        label: this.intl.t('semanticData.filters.validation'),
      },
      generator: {
        label: this.intl.t('semanticData.filters.generator'),
      },
      scope: { label: this.intl.t('semanticData.filters.scope') },
      inputData: {
        label: this.intl.t('semanticData.filters.inputData'),
      },
      formNode: { label: this.intl.t('semanticData.filters.formNode') },
      unTagged: {
        label: this.intl.t('semanticData.filters.unTagged'),
      },
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

  get parentNodeFormUris() {
    return [FORM('Form').value, FORM('TopLevelForm').value];
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
