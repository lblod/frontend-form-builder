import Model, { attr, hasMany } from '@ember-data/model';

export default class ConceptSchemeModel extends Model {
  @attr uri;
  @attr preflabel;
  @hasMany('concept', { inverse: null, async: false }) concepts;

  get label() {
    return this.preflabel;
  }
}
