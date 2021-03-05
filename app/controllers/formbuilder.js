import Controller from '@ember/controller';
import template from '../util/basic-form-template';
import { v4 as uuidv4 } from 'uuid';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class FormsPlaygroundController extends Controller {

  @tracked template;

  constructor() {
    super(...arguments);
    this.produced = 0;
    this.template = template;
  }

  @action
  insertFieldInForm(field) {
    this.produced += 1;
    const displayType = field.displayType.value;
    const form = "main";
    const group = "8e24d707-0e29-45b5-9bbf-a39e4fdb2c11";
    const uuid = uuidv4();

    const ttl = `
##########################################################
# ${field.label.value}
##########################################################
fields:${uuid} a form:Field ;
    mu:uuid "${uuid}";
    sh:name "Name" ;
    sh:order ${this.produced * 10} ;
    sh:path ext:${uuidv4()} ;
    form:displayType displayTypes:${displayType} ;
    sh:group fields:${group} .

fieldGroups:${form} form:hasField fields:${uuid} .`;
    this.template += `\n${ttl}`;
  }


}


