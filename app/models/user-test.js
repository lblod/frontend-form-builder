import Model, { attr, belongsTo } from '@ember-data/model';

export default class UserTestModel extends Model {

  @attr('datetime', {
    defaultValue() {
      return new Date();
    },
  }) created;

  @attr('datetime', {
    defaultValue() {
      return new Date();
    },
  }) modified;

  @belongsTo('generated-form') form;
}
