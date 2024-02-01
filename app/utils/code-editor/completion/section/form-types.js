import { createCompletionsFor } from '../create-completion-for';

export function getFormTypeCompletions() {
  return createCompletionsFor(
    {
      type: `keyword`,
      section: `Form types`,
      info: `Form types`,
      boost: 99, // This is not doing anything IMO
    },
    [
      `form:Field`,
      `form:Section`,
      `form:Listing`,
      `form:SubForm`,
      `form:Scope`,
      `form:Generator`,
      `form:partOf`,
    ]
  );
}
