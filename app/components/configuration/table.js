import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { SHACL, FORM } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';

export default class ConfigurationTableComponent extends Component {
  @tracked minRowsValue;
  @tracked maxRowsValue;
  @tracked isShowingTableIndices;
  @tracked indexColumnLabel;

  constructor() {
    super(...arguments);

    const minRowsValueStatement = this.store.any(
      this.tableSubject,
      SHACL('minCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (minRowsValueStatement) {
      this.minRowsValue = Number(minRowsValueStatement.value);
    }

    const maxRowsValueStatement = this.store.any(
      this.tableSubject,
      SHACL('maxCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (maxRowsValueStatement) {
      this.maxRowsValue = Number(maxRowsValueStatement.value);
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
  updateMinRowsValue(event) {
    const currentMinValue = this.store.match(
      this.tableSubject,
      SHACL('minCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (currentMinValue) {
      this.args.store.removeStatements(currentMinValue);
    }

    this.minRowsValue = event.target.value;
    if (this.minRowsValue) {
      if (this.minRowsValue > this.limits.max) {
        this.minRowsValue = this.limits.max;
      }
      if (this.minRowsValue < this.limits.min) {
        this.minRowsValue = this.limits.min;
      }

      this.args.store.addAll([
        new Statement(
          this.tableSubject,
          SHACL('minCount'),
          Number(this.minRowsValue),
          this.graphs.sourceGraph
        ),
      ]);
    }

    this.args.updatedTtl(this.ttlForStore);
  }

  @action
  updateMaxRowsValue(event) {
    const currentMaxValue = this.store.match(
      this.tableSubject,
      SHACL('maxCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (currentMaxValue) {
      this.args.store.removeStatements(currentMaxValue);
    }

    this.maxRowsValue = event.target.value;
    if (this.maxRowsValue) {
      if (this.maxRowsValue > this.limits.max) {
        this.maxRowsValue = this.limits.max;
      }
      if (this.maxRowsValue < this.limits.min) {
        this.maxRowsValue = this.limits.min;
      }

      this.store.addAll([
        new Statement(
          this.tableSubject,
          SHACL('maxCount'),
          Number(this.maxRowsValue),
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
