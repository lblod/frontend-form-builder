import Controller from '@ember/controller';

import { v4 as uuidv4 } from 'uuid';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
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
  @service store;

  @tracked forkingStore;
  @tracked code;

  constructor() {
    super(...arguments);
    this.produced = 0;
  }

  @task
  *refresh(value) {
    this.forkingStore = new ForkingStore();
    this.forkingStore.parse(
      value || this.code,
      GRAPHS.formGraph.value,
      'text/turtle'
    );
    const meta = yield this.meta.extract(this.forkingStore, { graphs: GRAPHS });
    this.forkingStore.parse(meta, GRAPHS.metaGraph.value, 'text/turtle');
  }

  @action
  insertFieldInForm(field) {
    this.produced += 1;
    const displayType = field.displayType.value;
    const form = 'main';
    const group = '8e24d707-0e29-45b5-9bbf-a39e4fdb2c11';
    const uuid = uuidv4();
    const path = uuidv4();
    const options = {};

    if (field.scheme) {
      options['conceptScheme'] = field.scheme.value.uri;
      options['searchEnabled'] = false;
    }

    let validationPart = '';
    if (field.validations && field.validations.length) {
      validationPart = this.validationsToTtl(field.validations, path);
    }

    const ttl = `
##########################################################
# ${field.label.value}
##########################################################
fields:${uuid} a form:Field ;
    sh:name "Naamloze vraag" ;
    sh:order ${this.produced * 10} ;
    sh:path ext:${path} ;
    form:options """${JSON.stringify(options)}""" ;
    form:displayType displayTypes:${displayType} ;
    ${validationPart}
    sh:group fields:${group} .

fieldGroups:${form} form:hasField fields:${uuid} .`;
    this.codeEditor += `\n${ttl}`;
    this.refresh.perform();
  }

  validationsToTtl(validations, formPath) {
    let validationPart = `form:validations`;
    validations.forEach((validation) => {
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
      sh:path ext:${formPath} ],`;
    });
    validationPart = validationPart.slice(0, -1) + ' ;';
    return validationPart;
  }

  @action
  async deleteForm() {
    const generatedForm = this.args.model;
    const isDeleted = await generatedForm.destroyRecord();
    if (isDeleted) {
      this.router.transitionTo('index');
    }
  }

  @action
  async updateForm() {
    const d = new Date();
    const FormattedDateTime = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}, ${d.toLocaleTimeString()}`;
    this.store.findRecord('generated-form', this.args.model.id).then((form) => {
      form.modified = FormattedDateTime;
      form.ttlCode = this.args.template;
      form.label = this.formLabel;
      form.comment = this.formComment;
      form.save();
    });
  }
}
