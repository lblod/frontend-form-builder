import Service from '@ember/service';

const EMPTY_FORMBUILDER_ID = ''

export default class FormbuilderIdServiceService extends Service {
  formbuilderId = EMPTY_FORMBUILDER_ID;

  setFormbuilderId(id) {
    this.formbuilderId = id;
  }

  getFormbuilderId() {
    return this.formbuilderId;
  }

  clearFormbuilderId() {
    this.formbuilderId = EMPTY_FORMBUILDER_ID;
  }
}
