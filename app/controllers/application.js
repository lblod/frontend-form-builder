import Controller from '@ember/controller';
import template from '../util/basic-form-template';

export default class FormsPlaygroundController extends Controller {
  constructor() {
    super(...arguments);
    this.template = template;
  }
}


