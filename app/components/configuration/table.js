import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { SHACL, FORM, RDF } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';

export default class ConfigurationTableComponent extends Component {
  @tracked minValue;
  @tracked maxValue;
  @tracked isShowingTableIndices;
  @tracked indexColumnLabel;

  constructor() {
    super(...arguments);

    const tableSubject = this.tableListingInSection;

    const minColumnsValueStatement = this.store.any(
      tableSubject,
      SHACL('minCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (minColumnsValueStatement) {
      this.minValue = Number(minColumnsValueStatement.value);
    }

    const maxColumnsValueStatement = this.store.any(
      tableSubject,
      SHACL('maxCount'),
      undefined,
      this.graphs.sourceGraph
    );
    if (maxColumnsValueStatement) {
      this.maxValue = Number(maxColumnsValueStatement.value);
    }
    const showIndicesStatement = this.store.any(
      tableSubject,
      FORM('showTableRowIndex'),
      undefined,
      this.graphs.sourceGraph
    );

    if (showIndicesStatement) {
      this.isShowingTableIndices = Boolean(showIndicesStatement.value);
    }
    const indicesLabelStatement = this.store.any(
      tableSubject,
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
    const tableSubject = this.tableListingInSection;
    const currentIndexColumnLabel = this.store.match(
      tableSubject,
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
        tableSubject,
        FORM('tableIndexLabel'),
        this.indexColumnLabel,
        this.graphs.sourceGraph
      ),
    ]);
    this.args.updatedTtl(this.ttlForStore);
  }

  @action
  showIndicesInTable(checkBoxState) {
    const tableSubject = this.tableListingInSection;
    const showIndices = this.store.match(
      tableSubject,
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
          tableSubject,
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
    const tableSubject = this.tableListingInSection;
    const currentMinValue = this.store.match(
      tableSubject,
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
          tableSubject,
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
    const tableSubject = this.tableListingInSection;
    const currentMaxValue = this.store.match(
      tableSubject,
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
          tableSubject,
          SHACL('maxCount'),
          Number(this.maxValue),
          this.graphs.sourceGraph
        ),
      ]);
    }

    this.args.updatedTtl(this.ttlForStore);
  }

  get tableListingInSection() {
    const tableListings = this.store
      .match(
        undefined,
        RDF('type'),
        FORM('ListingTable'),
        this.graphs.sourceGraph
      )
      .map((triple) => triple.subject);

    for (const tableListing of tableListings) {
      const isPartOf = this.store.any(
        tableListing,
        FORM('partOf'),
        this.section.parent
      );

      if (!isPartOf) continue;

      return tableListing;
    }

    throw `Could not find table listing in section: ${this.section.parent.value}`;
  }

  get section() {
    return this.args.section;
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