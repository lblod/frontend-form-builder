import Service from '@ember/service';

import { ForkingStore } from '@lblod/ember-submission-form-fields';

export default class ForkingStoreManagerService extends Service {
  builderStore = null;
  previewStore = null;
  fieldStores = [];

  // temp method
  getStoreOverView() {
    return {
      builderStore: this.builderStore,
      previewStore: this.previewStore,
      fieldStores: this.fieldStores,
    };
  }

  isForkingStore(store) {
    return store instanceof ForkingStore;
  }

  getBuilderStore() {
    if (!this.isForkingStore(this.builderStore)) {
      throw `Builderstore is not define.`;
    }

    return this.builderStore;
  }

  getPreviewStore() {
    if (!this.isForkingStore(this.previewStore)) {
      throw `Previewstore is not define.`;
    }

    return this.previewStore;
  }

  getFieldStores() {
    return this.fieldStores;
  }

  setBuilderStore(builderStore) {
    if (!this.isForkingStore(builderStore)) {
      throw `The store you want to assign to the builderStore is not a ForkingStore.`;
    }

    if (this.builderStore) {
      console.info(`Overwriting the builder store after set to null.`);
      this.builderStore = null;
    }

    this.builderStore = builderStore;
  }

  setPreviewStore(previewStore) {
    if (!this.isForkingStore(previewStore)) {
      throw `The store you want to assign to the previewStore is not a ForkingStore.`;
    }

    this.previewStore = previewStore;
  }

  addFieldStores(storesToAdd) {
    for (const storeWithSubject of storesToAdd) {
      this.addFieldStore(storeWithSubject.subject, storeWithSubject.store);
    }
  }

  addFieldStore(fieldSubject, store) {
    if (!this.isFieldSubjectInList(fieldSubject)) {
      this.fieldStores.push({
        subject: fieldSubject,
        store: store,
      });
    }
  }

  isFieldSubjectInList(fieldSubject) {
    const matches = this.fieldStores.filter(
      (storeInList) => storeInList.subject.value == fieldSubject.value
    );

    if (matches.length == 0) {
      return false;
    }

    console.info(
      `Tried adding a second field store for subject: ${fieldSubject.value}`
    );
    return true;
  }
}
