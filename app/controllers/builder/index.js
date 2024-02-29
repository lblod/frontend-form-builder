import Controller from '@ember/controller';

export default class BuilderController extends Controller {
  constructor() {
    super(...arguments);
    console.log(`Builder | controller`);
  }
}
