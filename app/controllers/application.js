import Controller from '@ember/controller';
import template from '../util/basic-form-template';
import { v4 as uuidv4 } from 'uuid';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class FormsPlaygroundController extends Controller {
  @tracked template;

  constructor() {
    super(...arguments);
    this.template = template;
  }

  @action
  insertFieldInForm(field) {
    const displayType = field.displayType.value;
    const uuid = uuidv4();

    const ttl = `
      fields:${uuid} a form:Field ;
        mu:uuid "${uuid}" ;
        sh:name "Name" ;
        sh:order 100 ;
        sh:path ext:path ;
        form:displayType displayTypes:${displayType} .
        # sh:group fields:3803a690-3226-4cf3-b58c-0171921fd3cd . # TODO
    `;

    this.ttl = ttl;
  }
}


