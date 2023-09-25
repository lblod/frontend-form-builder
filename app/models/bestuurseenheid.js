import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class Bestuurseenheid extends Model {
  @attr naam;
  @attr('string-set') alternatieveNaam;

  @belongsTo('werkingsgebied', { async: true, inverse: null }) werkingsgebied;
  @belongsTo('werkingsgebied', { async: true, inverse: null }) provincie;
  @belongsTo('bestuurseenheid-classificatie-code', {
    async: true,
    inverse: null,
  })
  classificatie;
  @hasMany('bestuursorgaan', { async: true, inverse: null }) bestuursorganen;

  get fullName() {
    let classificatie = this.belongsTo('classificatie').value().label;
    return `${classificatie} ${this.naam}`.trim();
  }
}
