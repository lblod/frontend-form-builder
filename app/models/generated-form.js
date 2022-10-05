import Model, { attr } from '@ember-data/model';

export default class GeneratedFormModel extends Model {
  @attr('datetime') created;
  @attr('datetime') modified;
  @attr('string') label;
  @attr('string') comment;
  @attr('string') ttlCode;
}
