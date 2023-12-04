import { getDisplayTypeCompletions } from './sections/display-types';
import { getFormPredicateCompletions } from './sections/form-predicates';
import { getFormTypeCompletions } from './sections/form-types';
import { getPrefixCompletions } from './sections/prefixes';
import { getShaclPredicateCompletions } from './sections/sh-predicates';
import { getValidationCompletions } from './sections/validation-types';

export default [
  ...getFormTypeCompletions(),
  ...getFormPredicateCompletions(),
  ...getShaclPredicateCompletions(),
  ...getValidationCompletions(),
  ...getDisplayTypeCompletions(),
  ...getPrefixCompletions(),
];
