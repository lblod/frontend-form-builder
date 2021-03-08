import Model, { attr, belongsTo } from '@ember-data/model';

export default class UserTestModel extends Model {

  @attr('date', {
    defaultValue() {
      return new Date();
    },
  }) created;

  @attr('date', {
    defaultValue() {
      return new Date();
    },
  }) modified;

  @belongsTo('generated-form') form;
}
