import Model, { attr, hasMany } from '@ember-data/model';

export default class ConceptSchemeModel extends Model {
  @attr uri;
  @attr('datetime') createdat;
  @attr preflabel;
  @attr description;
  @attr ispublic;
  @hasMany('concept', { inverse: null, async: true }) concepts;

  get label() {
    return this.preflabel;
  }

  get isPublic() {
    return this.ispublic;
  }

  get createdAt() {
    return this.createdat ?? null;
  }
}
