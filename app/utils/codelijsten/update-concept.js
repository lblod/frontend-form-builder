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
    showSuccessToasterMessage(toasterService, concept.id, 'Concept bijgewerkt');
  } catch (error) {
    showErrorToasterMessage(
      toasterService,
      concept.id,
      'Concept niet aangepast'
    );
    console.error(error);
  }
}
