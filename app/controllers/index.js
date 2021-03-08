import Controller from '@ember/controller';

export default class IndexController extends Controller {
  sort = '-created';
  page = 0;
  size = 20;
}
