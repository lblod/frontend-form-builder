import { createCompletionsFor } from '../create-completion-for';

export function getFormGroupingTypeCompletions() {
  return createCompletionsFor(
    {
      type: `keyword`,
      section: `Form grouping type`,
      info: `Form grouping types`,
      boost: 95, // This is not doing anything IMO
    },
    [`form:Bag ;`, `form:MatchEvery ;`, `form:MatchSome ;`]
  );
}
