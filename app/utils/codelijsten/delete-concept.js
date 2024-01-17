import {
  showErrorToasterMessage,
  showSuccessToasterMessage,
} from '../toaster-message-helper';

export async function deleteConcept(
  conceptId,
  store,
  toasterService,
  silentDelete = false
) {
  try {
    const conceptMatches = await store.query('concept', {
      filter: { ':id:': conceptId },
    });

    if (conceptMatches.length == 0) {
      return;
    }
    conceptMatches.map(async (concept) => await concept.destroyRecord());

    if (silentDelete) {
      return;
    }

    showSuccessToasterMessage(toasterService, conceptId, 'Concept verwijderd');
  } catch (error) {
    if (silentDelete) {
      console.error(`Kon concept met id ${conceptId} niet verwijderen`);
      return;
    }

    showErrorToasterMessage(
      toasterService,
      conceptId,
      'Concept niet verwijderd'
    );
  }
}
