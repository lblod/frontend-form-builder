import Model, { attr } from '@ember-data/model';

export default class GeneratedFormModel extends Model {
  @attr('datetime') created;
  @attr('datetime') modified;
  @attr label;
  @attr comment;
  @attr ttlCode;
}
