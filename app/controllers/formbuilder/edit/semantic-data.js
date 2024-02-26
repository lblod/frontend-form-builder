import Controller from '@ember/controller';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../edit';
import { RDF, FORM } from '@lblod/submission-form-helpers';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { getMinimalNodeInfo } from '../../../utils/forking-store-helpers';

export default class FormbuilderEditSemanticDataController extends Controller {
  model;
  @tracked data = A([]);

  mapFormData = restartableTask(async () => {
    const store = new ForkingStore();
    store.parse(this.formTtl, this.graphs.sourceGraph, 'text/turtle');

    const sections = this.getSectionsInForm(store);
    this.mapSectionsToKey(sections, store);
  });

  mapSectionsToKey(sections, store) {
    for (const sectionSubject of sections) {
      const info = getMinimalNodeInfo(
        sectionSubject,
        store,
        this.graphs.sourceGraph
      );
      this.data.pushObject({
        type: this.dataTypes.section,
        ...info,
      });
    }
  }

  getSectionsInForm(store) {
    const sections = store
      .match(undefined, RDF('type'), FORM('Section'), this.graphs.sourceGraph)
      .map((st) => st.subject);

    const propertyGroups = store
      .match(
        undefined,
        RDF('type'),
        FORM('PropertyGroup'),
        this.graphs.sourceGraph
      )
      .map((st) => st.subject);

    return [...sections, ...propertyGroups];
  }

  setup(model) {
    this.model = model;

    this.mapFormData.perform();
  }

  get formTtl() {
    return this.model.ttlCode;
  }

  get graphs() {
    return GRAPHS;
  }

  get dataTypes() {
    return {
      section: 'Section',
    };
  }
}
