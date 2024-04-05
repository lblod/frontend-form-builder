import { showErrorToasterMessage } from '../toaster-message-helper';

export async function updateConcept(concept, store, toasterService) {
  let conceptInDatabase = await store.findRecord('concept', concept.id);
  if (concept.label.trim() == '') {
    await conceptInDatabase.destroyRecord();
  }

  if (
    concept.label.trim() == conceptInDatabase.label &&
    concept.order == conceptInDatabase.order
  ) {
    return;
  }

  conceptInDatabase.preflabel = concept.label;
  conceptInDatabase.order = concept.order;
  try {
    await conceptInDatabase.save();
    conceptInDatabase.reload();
  } catch (error) {
    showErrorToasterMessage(
      toasterService,
      concept.id,
      'Concept niet aangepast'
    );
    console.error(error);
  }
}
