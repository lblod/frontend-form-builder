import { helper } from '@ember/component/helper';

export default helper(function FormatDateTime([date]) {
  if (!(date instanceof Date)) {
    return '';
  }

  return new Intl.DateTimeFormat('nl-BE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
});
