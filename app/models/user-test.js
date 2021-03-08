import Model, {attr, belongsTo} from '@ember-data/model';

export default class UserTestModel extends Model {
  @attr('string') title;
  @attr('string') comment;
  @attr('string') ttlCode;

  @belongsTo("generated-form") form;
}
