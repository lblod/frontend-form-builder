import { helper } from '@ember/component/helper';

export default helper(function FormatDate([date]) {
  if (!(date instanceof Date)) {
    return '';
  }

  return new Intl.DateTimeFormat('nl-BE').format(date);
});
