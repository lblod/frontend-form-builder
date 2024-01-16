import {
  showErrorToasterMessage,
  showSuccessToasterMessage,
} from '../toaster-message-helper';

export async function deleteConcept(conceptId, store, toasterService) {
  try {
    const concept = await store.findRecord('concept', conceptId);
    await concept.destroyRecord();

    showSuccessToasterMessage(
      toasterService,
      `Concept met id ${conceptId} successvol verwijderd`,
      'Concept verwijderd'
    );
  } catch (error) {
    showErrorToasterMessage(
      toasterService,
      `Kon concept met id ${conceptId} niet verwijderen `,
      'Concept'
    );
  }
}
