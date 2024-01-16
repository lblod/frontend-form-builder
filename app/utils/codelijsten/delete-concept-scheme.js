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
      `Conceptscheme met id ${conceptSchemeId} successvol verwijderd`,
      'Conceptscheme verwijderd'
    );
  } catch (error) {
    showErrorToasterMessage(
      toasterService,
      `Kon conceptscheme met id ${conceptSchemeId} niet verwijderen `,
      'Conceptscheme'
    );
  }
}
