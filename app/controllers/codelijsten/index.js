import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class CodelijstenController extends Controller {
  @service features;

  sort = '-preflabel';
  page = 0;
  size = 20;
}
