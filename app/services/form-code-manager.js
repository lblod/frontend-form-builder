import Service from '@ember/service';

export default class FormCodeManagerService extends Service {
  startVersion = -1;

  formCodeHistory = [];
  version = this.startVersion; // -1 so start version is 0
  referenceVersion = this.startVersion;

  getLatestVersion() {
    return this.version;
  }

  pinLatestVersionAsReferenceTtl() {
    this.referenceVersion = this.getLatestVersion();
  }

  getHistory() {
    return this.formCodeHistory;
  }

  clearHistory() {
    this.formCodeHistory = [];
    this.version = this.startVersion;
  }

  addFormCode(ttl) {
    if (this.isTtlTheSameAsLatest(ttl)) {
      return;
    }

    this.version++;
    this.formCodeHistory[this.version] = ttl;
  }

  isTtlTheSameAsLatest(compareTtl) {
    const latestTtl = this.formCodeHistory[this.getLatestVersion()];

    return compareTtl == latestTtl;
  }

  isLatestDeviatingFromReference() {
    if (this.getLatestVersion() == this.referenceVersion) {
      return false;
    }

    return !this.isTtlTheSameAsLatest(
      this.formCodeHistory[this.referenceVersion]
    );
  }
}
