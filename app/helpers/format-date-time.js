import { helper } from '@ember/component/helper';
import { isValidDate } from 'frontend-form-builder/utils/date';

export default helper(function FormatDateTime([date]) {
  if (!isValidDate(date)) {
    return '';
  }

  return new Intl.DateTimeFormat('nl-BE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
});
