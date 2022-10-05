import { helper } from '@ember/component/helper';
import { isValidDate } from 'frontend-form-builder/utils/date';

export default helper(function FormatDate([date]) {
  if (!isValidDate(date)) {
    return '';
  }

  return new Intl.DateTimeFormat('nl-BE').format(date);
});
