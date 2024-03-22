import { showErrorToasterMessage } from '../toaster-message-helper';

export async function updateConcept(concept, store, toasterService) {
  console.log(`concept`, concept.id, concept.label);
  let conceptInDatabase = await store.findRecord('concept', concept.id);
  if (concept.label.trim() == '') {
    await conceptInDatabase.destroyRecord();
  }

  if (concept.label.trim() == conceptInDatabase.label) {
    return;
  }

  conceptInDatabase.preflabel = concept.label;
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
