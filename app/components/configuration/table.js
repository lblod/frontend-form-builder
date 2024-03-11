import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { SHACL, FORM } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';

export default class ConfigurationTableComponent extends Component {
  @tracked minValue;
  @tracked maxValue;
  @tracked isShowingTableIndices;
  @tracked indexColumnLabel;

  constructor() {
    super(...arguments);

    const minColumnsValueStatement = this.store.any(
      this.tableSubject,
      SHACL('minCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (minColumnsValueStatement) {
      this.minValue = Number(minColumnsValueStatement.value);
    }

    const maxColumnsValueStatement = this.store.any(
      this.tableSubject,
      SHACL('maxCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (maxColumnsValueStatement) {
      this.maxValue = Number(maxColumnsValueStatement.value);
    }
    const showIndicesStatement = this.store.any(
      this.tableSubject,
      FORM('showTableRowIndex'),
      undefined,
      this.graphs.sourceGraph
    );

    if (showIndicesStatement) {
      this.isShowingTableIndices = Boolean(showIndicesStatement.value);
    }
    const indicesLabelStatement = this.store.any(
      this.tableSubject,
      FORM('tableIndexLabel'),
      undefined,
      this.graphs.sourceGraph
    );
    if (indicesLabelStatement) {
      this.indexColumnLabel = String(indicesLabelStatement.value);
    }
  }

  @action
  updateIndexLabel(event) {
    const currentIndexColumnLabel = this.store.match(
      this.tableSubject,
      FORM('tableIndexLabel'),
      undefined,
      this.graphs.sourceGraph
    );
    if (currentIndexColumnLabel) {
      this.args.store.removeStatements(currentIndexColumnLabel);
    }

    this.indexColumnLabel = event.target.value.trim() ?? '';
    this.args.store.addAll([
      new Statement(
        this.tableSubject,
        FORM('tableIndexLabel'),
        this.indexColumnLabel,
        this.graphs.sourceGraph
      ),
    ]);
    this.args.updatedTtl(this.ttlForStore);
  }

  @action
  showIndicesInTable(checkBoxState) {
    const showIndices = this.store.match(
      this.tableSubject,
      FORM('showTableRowIndex'),
      undefined,
      this.graphs.sourceGraph
    );

    if (showIndices.length >= 1) {
      this.store.removeStatements(showIndices);
    }
    if (checkBoxState) {
      this.args.store.addAll([
        new Statement(
          this.tableSubject,
          FORM('showTableRowIndex'),
          true,
          this.graphs.sourceGraph
        ),
      ]);
    }
    this.isShowingTableIndices = checkBoxState;
    this.args.updatedTtl(this.ttlForStore);
  }

  @action
  updateMinValue(event) {
    const currentMinValue = this.store.match(
      this.tableSubject,
      SHACL('minCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (currentMinValue) {
      this.args.store.removeStatements(currentMinValue);
    }

    this.minValue = event.target.value;
    if (this.minValue) {
      if (this.minValue > this.limits.max) {
        this.minValue = this.limits.max;
      }
      if (this.minValue < this.limits.min) {
        this.minValue = this.limits.min;
      }

      this.args.store.addAll([
        new Statement(
          this.tableSubject,
          SHACL('minCount'),
          Number(this.minValue),
          this.graphs.sourceGraph
        ),
      ]);
    }

    this.args.updatedTtl(this.ttlForStore);
  }

  @action
  updateMaxValue(event) {
    const currentMaxValue = this.store.match(
      this.tableSubject,
      SHACL('maxCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (currentMaxValue) {
      this.args.store.removeStatements(currentMaxValue);
    }

    this.maxValue = event.target.value;
    if (this.maxValue) {
      if (this.maxValue > this.limits.max) {
        this.maxValue = this.limits.max;
      }
      if (this.maxValue < this.limits.min) {
        this.maxValue = this.limits.min;
      }

      this.store.addAll([
        new Statement(
          this.tableSubject,
          SHACL('maxCount'),
          Number(this.maxValue),
          this.graphs.sourceGraph
        ),
      ]);
    }

    this.args.updatedTtl(this.ttlForStore);
  }

  get tableName() {
    const name = this.store.any(
      this.tableSubject,
      SHACL('name'),
      undefined,
      this.graphs.sourceGraph
    );

    if (name && name.value.trim() !== '') {
      return name.value;
    }

    return null;
  }

  get tableSubject() {
    return this.args.tableListingSubject;
  }

  get graphs() {
    return this.args.graphs;
  }

  get store() {
    return this.args.store;
  }

  get ttlForStore() {
    return this.store.serializeDataMergedGraph(this.graphs.sourceGraph);
  }

  get limits() {
    return {
      min: 0,
      max: 15,
    };
  }
}
