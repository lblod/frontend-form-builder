import Model, { attr, belongsTo } from '@ember-data/model';

export default class GeneratedFormModel extends Model {
  @attr('string') created;
  @attr('string') modified;
  @attr('string') label;
  @attr('string') comment;
  @attr('string') ttlCode;
}
