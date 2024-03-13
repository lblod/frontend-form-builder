import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { guidFor } from '@ember/object/internals';
import { XSD, triplesForPath } from '@lblod/submission-form-helpers';
import { restartableTask } from 'ember-concurrency';

export default class BegrotingstabelTotalFieldComponent extends Component {
  @tracked totals;
  id = guidFor(this);

  constructor() {
    super(...arguments);

    this.store.registerObserver(() => {
      // This will potentially run a lot of times. We can probably check the delta and see if the change affects this component, but due to time constraints we're skipping that for now.
      // It's also possible that the delta checking is more intensive than the actual computations, but that would have to be benchmarked.
      this.calculateTotals.perform();
    }, this.id);
  }

  get fieldName() {
    return this.field.label;
  }

  get formattedTotal() {
    let amount = this.totals;
    if (!this.totals) {
      amount = 0.0;
    }

    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  calculateTotals = restartableTask(async () => {
    const target = this.store.any(
      this.field.uri,
      XSD('target'),
      undefined,
      this.graphs.formGraph
    );

    const options = {
      path: target,
      store: this.store,
      formGraph: this.graphs.formGraph,
      sourceGraph: this.graphs.sourceGraph,
      sourceNode: this.sourceNode,
    };

    const { values } = triplesForPath(options);

    this.totals = 0;
    for (const literal of values) {
      this.totals += Number(literal.value) ?? 0;
    }
  });

  willDestroy() {
    super.willDestroy(...arguments);
    this.store.deregisterObserver(this.id);
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
