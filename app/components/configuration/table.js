import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { SHACL, FORM, RDF } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';

export default class ConfigurationTableComponent extends Component {
  @tracked minValue;
  @tracked maxValue;

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
