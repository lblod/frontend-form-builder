import Service from '@ember/service';

export default class FormVersionService extends Service {
  VERSION_ONE = 'V1';
  VERSION_TWO = 'V2';
  VERSION_UNDETERMINED = 'UNKNOWN';

  PREFERED_VERSION = this.VERSION_TWO;

  getVersionForTtl(ttlCode) {
    if (this.isCombinationOfOneAndTwo(ttlCode)) {
      return this.VERSION_UNDETERMINED;
    }

    if (this.isVersionTwoForm(ttlCode)) {
      return this.VERSION_TWO;
    }

    if (this.isVersionOneForm(ttlCode)) {
      return this.VERSION_ONE;
    }

    return this.VERSION_UNDETERMINED;
  }

  isVersionOneForm(ttlCode) {
    const predicates = [':group', ':PropertyGroup', ':validations'];

    return predicates.some((predicate) =>
      ttlCode.match(this.#createRegexForWord(predicate))
    );
  }

  isVersionTwoForm(ttlCode) {
    const predicates = [':partOf', ':Section', ':validatedBy'];

    return predicates.some((predicate) =>
      ttlCode.match(this.#createRegexForWord(predicate))
    );
  }

  isCombinationOfOneAndTwo(ttlCode) {
    return this.isVersionOneForm(ttlCode) && this.isVersionTwoForm(ttlCode);
  }

  #createRegexForWord(word) {
    return new RegExp('\\b' + word + '\\b', 'g');
  }
}
