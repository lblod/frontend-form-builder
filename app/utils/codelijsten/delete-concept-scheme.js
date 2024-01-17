import {
  showErrorToasterMessage,
  showSuccessToasterMessage,
} from '../toaster-message-helper';

export async function deleteConceptScheme(
  conceptSchemeId,
  store,
  toasterService
) {
  try {
    const conceptScheme = await store.findRecord(
      'concept-scheme',
      conceptSchemeId
    );
    await conceptScheme.destroyRecord();

    showSuccessToasterMessage(
      toasterService,
      conceptSchemeId,
      'Conceptscheme verwijderd'
    );
  } catch (error) {
    showErrorToasterMessage(
      toasterService,
      conceptSchemeId,
      'Conceptscheme niet verwijderd'
    );
  }
}
