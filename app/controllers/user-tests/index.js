import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default class UserTestsIndexController extends Controller {
  @service store;

  sort = '-created';
  page = 0;
  size = 20;
}
