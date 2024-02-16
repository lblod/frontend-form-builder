import { createCompletionsFor } from '../create-completion-for';

export function getDisplayTypeCompletions() {
  return createCompletionsFor(
    {
      type: `keyword`,
      section: `Displaytypes`,
      info: `Field input types`,
      boost: 96, // This is not doing anything IMO
    },
    [
      `displayTypes:defaultInput`,
      `displayTypes:numericalInput`,
      `displayTypes:currencyInput`,
      `displayTypes:date`,
      `displayTypes:dateRange`,
      `displayTypes:textArea`,
      `displayTypes:files`,
      `displayTypes:remoteUrls`,
      `displayTypes:switch`,
      `displayTypes:checkbox`,
      `displayTypes:conceptSchemeSelector`,
      `displayTypes:conceptSchemeRadioButtons`,
      `displayTypes:conceptSchemeMultiSelectCheckboxes`,
      `displayTypes:conceptSchemeMultiSelector`,
    ]
  );
}
