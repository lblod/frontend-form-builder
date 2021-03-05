import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CodelijstenController extends Controller {

  @tracked codeList;

  @action updateCodeList(list) {
    this.codeList = list
  }
}
