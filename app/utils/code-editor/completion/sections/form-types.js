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
      `a form:Field ;`,
      `a form:PropertyGroup ;`,
      `a form:Listing ;`,
      `a form:SubForm ;`,
      `a form:Scope ;`,
      `a form:Generator ;`,
    ]
  );
}
