import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class CodelijstenController extends Controller {
  @service features;
  @service('formbuilder-id-service') formbuilderIdService;

  formbuilderId = null;

  sort = '-preflabel';
  page = 0;
  size = 20;

  setup(id) {
    this.formbuilderIdService.setFormbuilderId(id);
    console.log('111', this.formbuilderIdService.getFormbuilderId());
  }
}
