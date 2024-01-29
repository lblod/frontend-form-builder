import Service from '@ember/service';

export default class FormCodeManagerService extends Service {
  startVersion = -1;

  formCodeHistory = [];
  latestVersion = this.startVersion; // -1 so start version is 0
  referenceVersion = this.startVersion;

  formId = null;

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

  clearHistory() {
    this.formCodeHistory = [];
    this.latestVersion = this.startVersion;
  }

  #getTtlOfVersion(version) {
    if (version <= this.startVersion) {
      throw `The lowest version available is version: 0`;
    }
    if (version > this.latestVersion) {
      throw `The highest version available is version: ${this.latestVersion}`;
    }

    return this.formCodeHistory[version];
  }

  getFormId() {
    if (!this.formId) {
      throw `Could not get form id. Id is never set.`;
    }

    return this.formId;
  }

  setFormId(generatedFormId) {
    // Should we check if the ID exists?
    this.formId = generatedFormId;
  }
}
