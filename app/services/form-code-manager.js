import Service from '@ember/service';

export default class FormCodeManagerService extends Service {
  startVersion = -1;

  formCodeHistory = [];
  version = this.startVersion; // -1 so start version is 0

  getLatestVersion() {
    return this.version;
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
      console.info(
        `Did not create a new entry as the ttl code is the same as latest.`
      );
      return;
    }

    this.version++;
    this.formCodeHistory[this.version] = ttl;
  }

  isTtlTheSameAsLatest(compareTtl) {
    const latestTtl = this.formCodeHistory[this.getLatestVersion()];

    return compareTtl == latestTtl;
  }

  isFormChangedInLastVersion() {
    if (this.getLatestVersion() == 0) {
      console.info(
        `Form is not changed in latest. Current version ${this.getLatestVersion()}`
      );
      return false;
    }

    const previousVersion = this.getLatestVersion() - 1;

    return !this.isTtlTheSameAsLatest(this.formCodeHistory[previousVersion]);
  }
}
