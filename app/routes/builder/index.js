import Route from '@ember/routing/route';

export default class BuilderIndexRoute extends Route {
  model() {
    console.log(`Builder | route`);

    return {};
  }
}
