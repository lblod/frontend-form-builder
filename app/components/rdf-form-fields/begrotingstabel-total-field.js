import Component from '@glimmer/component';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { guidFor } from '@ember/object/internals';
import { XSD, triplesForPath } from '@lblod/submission-form-helpers';
import { restartableTask } from 'ember-concurrency';

export default class BegrotingstabelTotalFieldComponent extends Component {
  id = guidFor(this);

  @tracked totals = A([]);
  @tracked comparisonWarningMessage;

  constructor() {
    super(...arguments);

    this.store.registerObserver(() => {
      // This will potentially run a lot of times. We can probably check the delta and see if the change affects this component, but due to time constraints we're skipping that for now.
      // It's also possible that the delta checking is more intensive than the actual computations, but that would have to be benchmarked.
      this.calculateTotals.perform();
    }, this.id);
  }

  @action
  formatAmount(amount) {
    if (!amount) {
      amount = 0;
    }

    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  calculateTotals = restartableTask(async () => {
    const collections = this.store
      .match(this.field.uri, XSD('target'), undefined, this.graphs.formGraph)
      .map((st) => st.object);

    for (const collection of collections) {
      const options = {
        path: collection,
        store: this.store,
        formGraph: this.graphs.formGraph,
        sourceGraph: this.graphs.sourceGraph,
        sourceNode: this.sourceNode,
      };

      const possibleIndexOfCollection = this.getIndexOfTotal(collection.id);

      if (this.isValidIndex(possibleIndexOfCollection)) {
        this.totals.removeObject(this.totals[possibleIndexOfCollection]);
      }

      this.totals.pushObject({
        id: collection.id,
        collection: collection,
        values: A([]),
        calculationResult: undefined,
      });

      const { values } = triplesForPath(options);

      const indexOfCollection = this.getIndexOfTotal(collection.id);

      for (const literal of values) {
        this.totals[indexOfCollection].values.pushObject(
          Number(literal.value) ?? 0
        );
      }
      this.totals[indexOfCollection].calculationResult = this.totals[
        indexOfCollection
      ].values.reduce((a, b) => a + b, 0);
    }
    this.setWarningMessage();
  });

  getIndexOfTotal(collectionId) {
    return this.totals.findIndex((item) => item.id == collectionId);
  }

  isValidIndex(index) {
    return index == 0 || index !== -1;
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this.store.deregisterObserver(this.id);
  }

  setWarningMessage() {
    if (this.totals.length <= 1) {
      this.comparisonWarningMessage = null;

      return;
    }

    if (
      !this.totals.every(
        (item) => item.calculationResult == this.totals[0].calculationResult
      )
    ) {
      this.comparisonWarningMessage = `Results are not the same`;

      return;
    }

    this.comparisonWarningMessage = null;
  }

  get fieldName() {
    return this.field.label;
  }

  get field() {
    return this.args.field;
  }

  get store() {
    return this.args.formStore;
  }

  get graphs() {
    return this.args.graphs;
  }

  get sourceNode() {
    return this.args.sourceNode;
  }
}
