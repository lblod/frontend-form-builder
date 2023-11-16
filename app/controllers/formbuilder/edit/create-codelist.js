import Controller from '@ember/controller';

import { restartableTask, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '../../../utils/rdflib';
import { action } from '@ember/object';
import { A } from '@ember/array';

export default class FormbuilderEditCreateCodelistController extends Controller {
  @tracked builderStore;
  @tracked builderForm;

  @tracked formTtlCode;

  @tracked listName;
  @tracked newItem;
  @tracked listItems;
  @tracked generatedCodelistTtl;
  @tracked selectedItem;

  @action
  addItemToList() {
    if (!this.listItems) {
      this.listItems = A([]);
    }
    this.listItems.pushObject({
      name: this.newItem,
    });
    this.newItem = null;
    this.createCodeListTtlForItemList();
  }

  @action
  updateListName(event) {
    this.listName = event.target.value;
  }

  @action
  updateNewItemValue(event) {
    this.newItem = event.target.value;
  }

  @action
  setSelected(item) {
    this.selectedItem = item;
  }

  createCodeListTtlForItemList() {
    const prefixes = `
    @prefix rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix skos:	<http://www.w3.org/2004/02/skos/core#> .
    @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
    @prefix rdfs:	<http://www.w3.org/2000/01/rdf-schema#> .
    @prefix con:	<http://lblod.data.gift/concept-schemes/> .
    @prefix ext:	<http://mu.semte.ch/vocabularies/ext/> .
    @prefix sh: <http://www.w3.org/ns/shacl#>.
    `;

    const ttlItems = this.listItems.map((listItem) => {
      return this.createItemTtl(listItem.name);
    });
    const formattedName = this.formatNameForTtl(this.listName);

    this.generatedCodelistTtl = `
      ${prefixes}

      con:${formattedName} a skos:ConceptScheme ;
      skos:prefLabel  "${this.listName}" .

      ${ttlItems.join(' \n')}
    `;
  }

  createItemTtl(itemName) {
    const formattedName = this.formatNameForTtl(itemName);

    return `
    ext:customListItem${formattedName}
      rdf:type  rdfs:Class , skos:Concept ;
      skos:inScheme	con:${formattedName} ;
      skos:prefLabel  "${itemName}" .
    `;
  }

  formatNameForTtl(name) {
    const words = name.split(' ');

    for (let i = 0; i < words.length; i++) {
      const firstLetter = words[i][0];
      const restOfWord = words[i].substr(1);
      words[i] =
        firstLetter.toUpperCase() + restOfWord ?? firstLetter + restOfWord;
    }

    return words.join('');
  }

  setup() {
    this.setupBuilderForm.perform();
  }

  setupBuilderForm = restartableTask(async () => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);

    const { formTtl, graphs } = this.model;

    const builderStore = new ForkingStore();
    builderStore.parse(formTtl, graphs.formGraph, 'text/turtle');
    builderStore.parse(
      this.getFormTtlCode(),
      graphs.sourceGraph,
      'text/turtle'
    );

    this.builderStore = builderStore;
    this.builderForm = this.builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      graphs.formGraph
    );

    // const sourceTtl = this.builderStore.serializeDataMergedGraph(
    //   graphs.sourceGraph
    // );
    // console.log({ sourceTtl });

    this.builderStore.registerObserver(() => {
      this.handleBuilderFormChange.perform();
    });
  });

  handleBuilderFormChange = restartableTask(async () => {
    await timeout(1); // small timeout to group multiple store observer callbacks together

    this.formTtlCode = this.builderStore.serializeDataMergedGraph(
      this.model.graphs.sourceGraph
    );

    console.log(`this.formCodeTtl`, this.formCodeTtl);

    this.setup();
  });

  getFormTtlCode() {
    if (!this.formTtlCode || this.formTtlCode == '') {
      this.formCodeTtl = this.model.template;
    }

    return this.formCodeTtl;
  }
}
