export default class RouterHelper {
  static isCurrentlyOnRoute(router, path) {
    if (router.constructor.name !== 'RouterService') {
      throw `Router is not a RouterService`;
    }

    if (router.currentRouteName == path) {
      return true;
    }

    return false;
  }
}
