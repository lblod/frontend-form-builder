export async function getFormattedEditorCode(doc) {
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
  const doc = [];
  let text = String(textLeaf.text.map((line) => line.trim()).join(' '));
  let formatting = true;

  while (formatting) {
    const startText = text;
    if (text.trim() == '') {
      formatting = false;
    }

    if (!textHasAFormatMatch(text)) {
      formatting = false;
      continue;
    }

    for (const regex of regexFormats) {
      if (regex.test(text)) {
        const value = getFirstMatchWithFormat(text, regex);
        const matchedValue = value[0];

        if (value.index == 0) {
          doc.push(matchedValue);
          text = text.slice(matchedValue.length).trim();
        }
      }
    }

    if (text == startText) {
      const indexOfClosesMatch = findIndexOfNextClosesMatch(text);

      if (!indexOfClosesMatch) {
        // The loop will stop here
        // because im setting the formatting boolean to FALSE
        formatting = false;
        console.log('Stopped formatting. Ran into an unknown format', text);
        doc.push(text);
      }

      const textBeforeMatch = text.slice(0, indexOfClosesMatch).trim();
      doc.push(textBeforeMatch);
      text = text.slice(indexOfClosesMatch, undefined).trim();
    }
  }

  addIndentationToLines(doc);

  return doc;
}

function addIndentationToLines(doc) {
  let inValidationBlankNodes = false;
  for (let lineIndex = 0; lineIndex < doc.length; lineIndex++) {
    if (inValidationBlankNodes) {
      doc[lineIndex] = '\t' + doc[lineIndex];
    }

    if (
      prefixRegex.test(doc[lineIndex]) &&
      !prefixRegex.test(doc[lineIndex + 1])
    ) {
      doc[lineIndex] = doc[lineIndex] + '\n';
      continue;
    }

    if (
      predicateWithNodeValueRegex.test(doc[lineIndex]) ||
      predicateWithStringOrNumberValueRegex.test(doc[lineIndex])
    ) {
      doc[lineIndex] = '\t' + doc[lineIndex];

      if (doc[lineIndex].endsWith('.')) {
        doc[lineIndex] = doc[lineIndex] + '\n';
      }
      continue;
    }

    if (startOfValidationsRegex.test(doc[lineIndex])) {
      doc[lineIndex] = '\t' + doc[lineIndex];
      inValidationBlankNodes = true;
      continue;
    }
  }
}

const prefixRegex = new RegExp(/@prefix\s+([^:]+):\s+<([^>]+)>\s*\.*/);
const unknownPrefixRegexPattern = new RegExp(/@prefix\s+:\s+<#>\./);
const subjectWithTypeRegex = new RegExp(
  /(\w+):([\w-]+)\s+a\s+(\w+):(\w+)[;,]?/
);
const predicateWithNodeValueRegex = new RegExp(
  /(\w+):(\w+)\s+(\w+):\s*([^;\n\s]+)\s*[;\.]/
);
const predicateWithStringOrNumberValueRegex = new RegExp(
  /(\w+):(\w+)\s+("([^"]+)"|(\d+))\s*[;\.]/
);
const startOfValidationsRegex = new RegExp(/(\w+):([\w-]+)\s[\[]/);
const regexFormats = [
  prefixRegex,
  unknownPrefixRegexPattern,
  subjectWithTypeRegex,
  predicateWithNodeValueRegex,
  predicateWithStringOrNumberValueRegex,
  startOfValidationsRegex,
];

function getFirstMatchWithFormat(line, regex) {
  return line.match(regex);
}

function textHasAFormatMatch(text) {
  return (
    unknownPrefixRegexPattern.test(text) ||
    prefixRegex.test(text) ||
    subjectWithTypeRegex.test(text) ||
    predicateWithNodeValueRegex.test(text) ||
    predicateWithStringOrNumberValueRegex.test(text)
  );
}

function findIndexOfNextClosesMatch(text) {
  if (!textHasAFormatMatch(text)) {
    return null;
  }

  let index = null;
  for (const regex of regexFormats) {
    if (regex.test(text)) {
      const value = getFirstMatchWithFormat(text, regex);
      if (!index) {
        index = value.index;
      }

      if (value.index < index) {
        index = value.index;
      }
    }
  }

  return index;
}
