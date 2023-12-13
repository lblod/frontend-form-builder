import Model, { attr, hasMany } from '@ember-data/model';

export default class ConceptModel extends Model {
  @attr uri;
  @attr preflabel;
  @hasMany('concept-scheme', { inverse: null, async: true }) conceptSchemes;

  get label() {
    return this.preflabel;
  }
}
