import Model, { attr, hasMany } from '@ember-data/model';

export default class ConceptSchemeModel extends Model {
  @attr uuid;
  @attr label;
  @hasMany('concept', { inverse: null }) concepts;
}
