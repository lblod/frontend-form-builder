import Controller from '@ember/controller';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../edit';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
import { A } from '@ember/array';
import { service } from '@ember/service';
import { RDF, FORM } from '@lblod/submission-form-helpers';
import { sortObjectsOnProperty } from '../../../utils/sort-object-on-property';

export default class FormbuilderEditSemanticDataController extends Controller {
  @service('form-code-manager') formCodeManager;
  @service intl;

  @tracked filteredDataset = A([]);
  @tracked availableFilters = A([]);
  @tracked toggleAllFiltersLabel = this.toggleAllFilter.filtersOff.label;

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
        const inputDataFilter = this.filters.inputData;
        this.addFilter(inputDataFilter);
        this.filteredDataset[index].filters.pushObject(inputDataFilter);
      }
    }

    this.updateFilteredData.perform();
  });

  mapFormTtl = restartableTask(async (formTtlCode) => {
    this.fullDataset = A([]);
    this.filteredDataset = A([]);

    const store = new ForkingStore();
    store.parse(formTtlCode, this.graphs.sourceGraph, 'text/turtle');

    for (const statement of this.getAllStatementsInStore(store)) {
      this.addStatementToFilteredData(statement);

      if (this.isRdfTypePredicate(statement)) {
        const filter = this.getFilterForType(statement.object);

        if (filter) {
          const index = this.getIndexOfStatement(statement);
          this.filteredDataset[index].filters.pushObject(filter);
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
        filters: A([]),
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
    this.updateFilteredData.perform();
  }

  getFilterForType(object) {
    if (this.sectionUris.includes(object.value)) {
      const sectionFilter = this.filters.section;
      this.addFilter(sectionFilter);

      return sectionFilter;
    }

    if (this.validationUris.includes(object.value)) {
      const validationFilter = this.filters.validation;
      this.addFilter(validationFilter);

      return validationFilter;
    }

    if (this.parentNodeFormUris.includes(object.value)) {
      const formFilter = this.filters.formNode;
      this.addFilter(formFilter);

      return formFilter;
    }

    const filterForType = {
      [FORM('Field').value]: this.filters.field,
      [FORM('Scope').value]: this.filters.scope,
      [FORM('ListingTable').value]: this.filters.table,
      [FORM('Listing').value]: this.filters.listing,
      [FORM('SubForm').value]: this.filters.subform,
      [FORM('Generator').value]: this.filters.generator,
    };

    const filter = filterForType[object.value];

    if (filter) {
      this.addFilter(filter);
      return filter;
    }

    this.addFilter(this.filters.noFilter);
    return this.filters.noFilter;
  }

  addFilter(filter) {
    if (!filter) {
      return;
    }

    const filterLabels = Object.values(this.filters).map(
      (value) => value.label
    );
    if (!Object.values(filterLabels).includes(filter.label)) {
      throw `Filter is not recognized: (${filter.label ?? null})`;
    }

    if (
      !this.availableFilters.some(
        (activeFilter) => activeFilter.label == filter.label
      )
    ) {
      this.availableFilters.pushObject({
        order: filter.order,
        isActive: true,
        skin: this.filterStyle.active.skin,
        label: filter.label,
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

  setup() {
    this.availableFilters = A([]);
    this.mapFormTtl.perform(this.formCodeManager.getTtlOfLatestVersion());
    this.mapFormInputData.perform(
      this.formCodeManager.getInputDataForLatestFormVersion()
    );
  }

  @action
  addNewFormInputData(dataTtlCode) {
    this.mapFormTtl.perform(this.formCodeManager.getTtlOfLatestVersion());
    this.mapFormInputData.perform(dataTtlCode);
  }

  updateFilteredData = restartableTask(async () => {
    this.filteredDataset = this.fullDataset.filter((item) => {
      const canShow = item.filters.toArray().some((filter) => {
        if (this.activeFilterLabelsAsArray.includes(filter.label)) {
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

    this.updateToggleOfAllFiltersLabel.perform();
  });

  @action
  toggleAllFilters() {
    if (this.toggleAllFiltersLabel == this.toggleAllFilter.filtersOn.label) {
      this.toggleAllFiltersLabel = this.toggleAllFilter.filtersOff.label;
      this.toggleAllAvailableFilters(true);
      this.updateFilteredData.perform();

      return;
    }
    if (this.toggleAllFiltersLabel == this.toggleAllFilter.filtersOff.label) {
      this.toggleAllFiltersLabel = this.toggleAllFilter.filtersOn.label;
      this.toggleAllAvailableFilters(false);
      this.updateFilteredData.perform();

      return;
    }
  }

  toggleAllAvailableFilters(toggleState) {
    for (let index = 0; index < this.availableFilters.length; index++) {
      set(this.availableFilters[index], 'isActive', toggleState);
    }
  }

  updateToggleOfAllFiltersLabel = restartableTask(async () => {
    const activeAvailableFilters = this.availableFilters.filter(
      (filter) => filter.isActive
    );
    const inactiveAvailableFilters = this.availableFilters.filter(
      (filter) => !filter.isActive
    );

    if (activeAvailableFilters.length == this.availableFilters.length) {
      this.toggleAllFiltersLabel = this.toggleAllFilter.filtersOff.label;

      return;
    }
    if (inactiveAvailableFilters.length == this.availableFilters.length) {
      this.toggleAllFiltersLabel = this.toggleAllFilter.filtersOn.label;

      return;
    }

    if (activeAvailableFilters.length >= 1) {
      this.toggleAllFiltersLabel = this.toggleAllFilter.filtersOff.label;
    }
  });

  get orderedAvailableFilters() {
    return sortObjectsOnProperty(Object.values(this.availableFilters), 'order');
  }

  get activeFilterLabelsAsArray() {
    return this.availableFilters
      .filter((filter) => filter.isActive)
      .map((filter) => filter.label);
  }

  get graphs() {
    return GRAPHS;
  }

  get toggleAllFilter() {
    return {
      filtersOn: {
        label: this.intl.t('semanticData.filters.allOn'),
      },
      filtersOff: {
        label: this.intl.t('semanticData.filters.allOff'),
      },
    };
  }

  get filters() {
    return {
      formNode: {
        order: 1,
        label: this.intl.t('semanticData.filters.formNode'),
      },
      section: {
        order: 2,
        label: this.intl.t('semanticData.filters.section'),
      },
      field: { order: 3, label: this.intl.t('semanticData.filters.field') },
      validation: {
        order: 4,
        label: this.intl.t('semanticData.filters.validation'),
      },
      listing: {
        order: 5,
        label: this.intl.t('semanticData.filters.listing'),
      },
      subform: {
        order: 6,
        label: this.intl.t('semanticData.filters.subform'),
      },
      table: { order: 7, label: this.intl.t('semanticData.filters.table') },
      generator: {
        order: 8,
        label: this.intl.t('semanticData.filters.generator'),
      },
      scope: { order: 9, label: this.intl.t('semanticData.filters.scope') },
      inputData: {
        order: 10,
        label: this.intl.t('semanticData.filters.inputData'),
      },
      noFilter: {
        order: 11,
        label: this.intl.t('semanticData.filters.noFilter'),
      },
    };
  }

  get filterStyle() {
    return {
      toggleAll: {
        skin: 'link',
        icon: 'check',
      },
      active: {
        skin: 'success',
        icon: 'check',
      },
      inactive: {
        skin: 'default',
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
