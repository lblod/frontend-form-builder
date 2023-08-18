import { ForkingStore } from '@lblod/ember-submission-form-fields';

export default class ForkingStoreHelper {
  static isEmpty(_forkingStore) {
    return !_forkingStore || _forkingStore == this.getEmptyStoreValue();
  }

  static isForkingStore(_forkingStore) {
    return _forkingStore instanceof ForkingStore;
  }

  static getEmptyStoreValue() {
    return '';
  }
}
