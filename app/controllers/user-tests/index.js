import Controller from '@ember/controller';

export default class UserTestsIndexController extends Controller {
  sort = '-created';
  page = 0;
  size = 20;
}
