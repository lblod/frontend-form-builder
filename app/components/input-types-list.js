import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency-decorators';
import { inject as service } from '@ember/service';

export default class InputTypesListComponent extends Component {

  @service database;

  @tracked inputTypes = [];

  get sortedInputTypes() {
    return this.inputTypes.sort((a, b) => (a.label.value > b.label.value));
  }

  constructor() {
    super(...arguments);
    this.init.perform();
  }

  @task
  * init() {
    const response = yield this.database.query(` PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

    SELECT DISTINCT ?inputType ?label ?displayType ?usesConceptScheme {
      ?inputType skos:inScheme <http://lblod.data.gift/concept-schemes/c5a91bd7-3eb5-4d69-a51b-9bac6bf345f6> ;
        skos:prefLabel ?label ;
        ext:displayType ?displayType ;
        ext:usesConceptScheme ?usesConceptScheme .
    }`);
    const json = yield response.json();
    this.inputTypes = json.results.bindings;
  }
}
