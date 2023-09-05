import {
  getTopLevelPropertyGroups,
  getChildrenForPropertyGroup,
  validationTypesForField,
} from '@lblod/ember-submission-form-fields';

export function getAllFieldInForm(
  formTtlCode,
  previewStore,
  previewForm,
  graphs,
  sourceNode
) {
  // TODO add validation of the properties before executing the code below

  const fieldsInForm = [];
  if (formTtlCode == '') {
    return null;
  }

  const propertyGroups = getTopLevelPropertyGroups({
    store: previewStore,
    graphs: graphs,
    form: previewForm,
  });
  for (const group of propertyGroups) {
    const children = getChildrenForPropertyGroup(group, {
      form: previewForm,
      store: previewStore,
      graphs: graphs,
      sourceNode: sourceNode,
    });

    for (const field of children) {
      const validationTypes = validationTypesForField(field.uri, {
        store: previewStore,
        formGraph: graphs.formGraph,
      });
      fieldsInForm.push({
        fieldName: field.rdflibLabel,
        uri: field.uri,
        validationTypes: validationTypes,
      });
    }
  }

  return fieldsInForm;
}
