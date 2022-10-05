/* eslint-disable ember/no-test-import-export */ // False positive since the file has a `-test` suffix
import Model, { attr, belongsTo } from '@ember-data/model';

export default class UserTestModel extends Model {
  @attr uri;

  @attr('date', {
    defaultValue() {
      return new Date();
    },
  })
  created;

  @attr('date', {
    defaultValue() {
      return new Date();
    },
  })
  modified;

  @belongsTo('generated-form') form;
}
