import Model, {attr} from '@ember-data/model';

export default class FileModel extends Model {
  @attr('string') uri;
  @attr('string') filename;
  @attr('string') format;
  @attr('number') size;
}
