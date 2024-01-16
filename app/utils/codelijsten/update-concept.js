import {
  showErrorToasterMessage,
  showSuccessToasterMessage,
} from '../toaster-message-helper';

export async function updateConcept(concept, store, toasterService) {
  let conceptInDatabase = await store.findRecord('concept', concept.id);
  if (concept.label.trim() == '') {
    conceptInDatabase.destroyRecord();
  }
  if (
    concept.label.trim() == conceptInDatabase.label ||
    concept.label.trim() == ''
  ) {
    return;
  }

  conceptInDatabase.preflabel = concept.label;
  try {
    conceptInDatabase.save();
    conceptInDatabase.reload();
    showSuccessToasterMessage(
      toasterService,
      `Concept ${concept.id} bijgewerkt`,
      'Concept bijgewerkt'
    );
  } catch (error) {
    showErrorToasterMessage(
      toasterService,
      `Kon concept met id: ${concept.id} niet updaten`,
      'Concept'
    );
    console.error(error);
  }
}
