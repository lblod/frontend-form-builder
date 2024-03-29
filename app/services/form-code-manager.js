import Service from '@ember/service';
import { service } from '@ember/service';

export default class FormCodeManagerService extends Service {
  @service intl;

  startVersion = -1;

  formCodeHistory = [];
  latestVersion = this.startVersion; // -1 so start version is 0
  referenceVersion = this.startVersion;

  formId = null;
  formInputDataTtl = null;

  setFormInputDataTtl(ttl) {
    this.formInputDataTtl = ttl;
  }

  getInputDataForLatestFormVersion() {
    return this.formInputDataTtl;
  }

  getTtlOfLatestVersion() {
    return this.#getTtlOfVersion(this.latestVersion);
  }

  getTtlOfReferenceVersion() {
    return this.#getTtlOfVersion(this.referenceVersion);
  }

  pinLatestVersionAsReference() {
    this.referenceVersion = this.latestVersion;
  }

  addFormCode(ttl) {
    if (this.isTtlTheSameAsLatest(ttl)) {
      return;
    }

    this.latestVersion++;
    this.formCodeHistory[this.latestVersion] = ttl;
  }

  isTtlTheSameAsLatest(compareTtl) {
    const latestTtl = this.formCodeHistory[this.latestVersion];

    return compareTtl == latestTtl;
  }

  isLatestDeviatingFromReference() {
    if (this.latestVersion == this.referenceVersion) {
      return false;
    }

    return !this.isTtlTheSameAsLatest(
      this.formCodeHistory[this.referenceVersion]
    );
  }

  resetVersions() {
    this.latestVersion = this.startVersion;
    this.referenceVersion = this.startVersion;
  }

  clearHistory() {
    this.formCodeHistory = [];
    this.resetVersions();
  }

  reset() {
    this.clearHistory();
    this.formId = null;
  }

  #getTtlOfVersion(version) {
    if (version <= this.startVersion) {
      throw this.intl.t('messages.feedback.lowestVersionAvailable');
    }
    if (version > this.latestVersion) {
      throw this.intl.t('messages.feedback.highestversionAvailable', {
        version: this.latestVersion,
      });
    }

    return this.formCodeHistory[version];
  }

  getFormId() {
    if (!this.formId) {
      throw this.intl.t('messages.error.couldNotGetFormIdIsNotSet');
    }

    return this.formId;
  }

  setFormId(generatedFormId) {
    // Should we check if the ID exists?
    this.formId = generatedFormId;
  }

  isFormIdSet() {
    return this.formId;
  }
}
