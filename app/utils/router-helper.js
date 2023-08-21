export default class RouterHelper {
  static isCurrentlyOnRoute(_router, _path) {
    if (_router.constructor.name !== 'RouterService') {
      throw `Router is not a RouterService`;
    }

    if (_router.currentRouteName == _path) {
      return true;
    }

    return false;
  }
}
