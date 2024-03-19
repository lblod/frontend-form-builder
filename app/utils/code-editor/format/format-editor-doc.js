export async function getFormattedEditorCode(doc) {
  console.log(`doc`, doc);
  if (isTextLeaf(doc)) {
    return formatTextLeaf(doc);
  }
  if (isTextNode(doc)) {
    const newDocument = [];
    for (const textLeaf of doc.children) {
      const formattedLeaf = formatTextLeaf(textLeaf);
      newDocument.push(...formattedLeaf);
    }
    return newDocument;
  }
}

function isTextLeaf(doc) {
  return doc.text ? true : false;
}

function isTextNode(doc) {
  return doc.children ? true : false;
}

function formatTextLeaf(textLeaf) {
  if (!isTextLeaf(textLeaf)) {
    return [];
  }
  const formattedTextLeaf = [];
  for (const line of textLeaf.text) {
    console.log(`line`, line);
  }

  return formattedTextLeaf;
}
