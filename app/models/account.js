import Model, { belongsTo, attr } from '@ember-data/model';
export default class AccountModel extends Model {
  @attr voId;
  @attr provider;

  @belongsTo('gebruiker', { async: true, inverse: null }) gebruiker;
}
