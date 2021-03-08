import Controller from '@ember/controller';
import template from '../../util/basic-form-template';
import { v4 as uuidv4 } from 'uuid';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency-decorators';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { sym as RDFNode } from 'rdflib';
import { TEXT_AREA } from '../../components/playground';

export const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

export default class FormbuilderEditController extends Controller {

  @service('meta-data-extractor') meta;

  @tracked store;
  @tracked template;

  constructor() {
    super(...arguments);
    this.produced = 0;
    this.template = template;
  }

  @task
   * refresh() {
    this.store = new ForkingStore();
    this.store.parse(this.template, GRAPHS.formGraph.value, 'text/turtle');
    const meta = yield this.meta.extract(this.store, {graphs: GRAPHS});
    this.store.parse(meta, GRAPHS.metaGraph.value, 'text/turtle');

    // TODO should be done better
    const textarea = document.getElementById(TEXT_AREA.id);
    textarea.scrollTop = textarea.scrollHeight;
  }

  @action
  insertFieldInForm(field) {
    this.produced += 1;
    const displayType = field.displayType.value;
    const form = 'main';
    const group = '8e24d707-0e29-45b5-9bbf-a39e4fdb2c11';
    const uuid = uuidv4();
    const options = {};
    const validations = []

    if (field.scheme) {
      options['conceptScheme'] = field.scheme.value.uri;
      options['searchEnabled'] = false;
    }

    let validationPart = '';
    if (field.validations && field.validations.length) {
      validationPart = validationsToTtl(field.validations);
    }

    const ttl = `
##########################################################
# ${field.label.value}
##########################################################
fields:${uuid} a form:Field ;
    mu:uuid "${uuid}";
    sh:name "Naamloze vraag" ;
    sh:order ${this.produced * 10} ;
    sh:path ext:${uuidv4()} ;
    form:options """${JSON.stringify(options)}""" ;
    form:displayType displayTypes:${displayType} ;
    ${validationPart}
    sh:group fields:${group} .

fieldGroups:${form} form:hasField fields:${uuid} .`;
    this.template += `\n${ttl}`;
    this.refresh.perform();
  }

  function validationsToTtl(validations) {
    let validationPart = `form:validations`;
    validations.forEach(validation => {
      validationPart += `
    [ a form:${validation.validationName.value} ;
      form:grouping form:${validation.grouping.value} ;`;
      if (validation.customParameter) {
        validationPart += `
      form:${validation.customParameter.value} "Param to replace" ;`;
      }
      if (validation.errorMessage) {
        validationPart += `
      sh:resultMessage "${validation.errorMessage.value}" ;`;
      }
      validationPart += `
      sh:path ext:${uuidv4()} ],`
    });
    validationPart = validationPart.slice(0, -1) + ' ;';
    return validationPart;
  }
}
