import Model, { attr, belongsTo } from '@ember-data/model';

const RESOURCE_BASE = 'http://data.lblod.info/user-tests/';

export default class UserTestModel extends Model {
  /**
   * NOTE: using `@attr('string') uri;` causes PATCH to fail on resource
   */
  get uri() {
    return `${RESOURCE_BASE}${this.id}`;
  }

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
