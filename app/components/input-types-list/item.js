import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';
import { inject as service } from '@ember/service';

export default class InputTypesListItemComponent extends Component {

  @tracked scheme;
  @tracked validations = [];

  @service database;

  constructor() {
    super(...arguments);
    this.init.perform(this.args.inputType);
  }

  @task
  * init(inputType) {
    const response = yield this.database.query(`PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

    SELECT DISTINCT ?validation ?label ?validationName ?grouping ?customParameter ?errorMessage {
      <${inputType.inputType.value}> ext:canHaveValidation ?validation .
      ?validation skos:prefLabel ?label ;
        ext:validationName ?validationName ;
        ext:formGrouping ?grouping .
      OPTIONAL { ?validation ext:customParameter ?customParameter . }
      OPTIONAL { ?validation ext:errorMessage ?errorMessage . }
    }`);
    const json = yield response.json();
    this.validations = json.results.bindings;
  }

  get hasScheme() {
    return Boolean(Number(this.args.inputType.usesConceptScheme.value));
  }

  get hasContent() {
    return Boolean(Number(this.args.inputType.usesConceptScheme.value)) || this.validations;
  }

  @action
  updateScheme(scheme) {
    this.args.inputType['scheme'] = {
      value: scheme,
    };
  }

  @action
  updateValidations(validation, event) {
    if (event.target.checked) {
      this.args.inputType['validations'] = this.args.inputType['validations'] || [];
      this.args.inputType['validations'].push(validation);
    } else {
      this.args.inputType['validations'] = this.args.inputType['validations'].filter(val => {
        return val != validation;
      });
    }
  }
}
