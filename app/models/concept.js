import Model, { attr, hasMany } from '@ember-data/model';

export default class ConceptModel extends Model {
  @attr uuid;
  @attr label;
  @hasMany('concept-scheme', { inverse: null }) conceptSchemes;
}
