import Service from '@ember/service';

export default class FormbuilderIdServiceService extends Service {
  formbuilderId = null;

  setFormbuilderId(id) {
    this.formbuilderId = id;
  }

  getFormbuilderId() {
    return this.formbuilderId;
  }
}
