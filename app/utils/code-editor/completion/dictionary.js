import { getDisplayTypeCompletions } from './section/display-types';
import { getFormGroupingTypeCompletions } from './section/form-grouping-types';
import { getFormPredicateCompletions } from './section/form-predicates';
import { getFormTypeCompletions } from './section/form-types';
import { getPrefixCompletions } from './section/prefixes';
import { getShaclPredicateCompletions } from './section/sh-predicates';
import { getValidationCompletions } from './section/validation-types';

export default [
  ...getFormTypeCompletions(),
  ...getFormPredicateCompletions(),
  ...getShaclPredicateCompletions(),
  ...getValidationCompletions(),
  ...getDisplayTypeCompletions(),
  ...getFormGroupingTypeCompletions(),
  ...getPrefixCompletions(),
];
