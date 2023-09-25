import Model, { attr, hasMany } from '@ember-data/model';

export default class Werkingsgebied extends Model {
  @attr uri;
  @attr naam;
  @attr niveau;

  @hasMany('bestuurseenheid', { async: true, inverse: null }) bestuurseenheid;
  @hasMany('bestuurseenheid', { async: true, inverse: null })
  bestuurseenhedenInProvincie;

  get longName() {
    let niveau = this.niveau;
    let naam = this.naam;
    return `${naam} (${niveau})`;
  }
}