import Model, { attr, hasMany } from '@ember-data/model';

export default class ConceptSchemeModel extends Model {
  @attr uri;
  @attr preflabel;
  @attr ispublic;
  @hasMany('concept', { inverse: null, async: true }) concepts;

  get label() {
    return this.preflabel;
  }

  get isPublic() {
    return this.ispublic;
  }
}
