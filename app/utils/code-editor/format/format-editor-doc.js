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
      formatting = false;
      console.log('Stopped formatting. Ran into an unknown format', text);
      doc.push(text);
    }
  }

  return doc;
}

const prefixRegex = new RegExp(/@prefix\s+([^:]+):\s+<([^>]+)>\s*\.*/);
const unknownPrefixRegexPattern = new RegExp(/@prefix\s+:\s+<#>\./);
const subjectWithTypeRegex = new RegExp(/(\w+):([\w-]+)\s+a\s+(\w+):(\w+);/);
const predicateWithNodeValueRegex = new RegExp(
  /(\w+):(\w+)\s+(\w+):\s*([^;\n\s]+)\s*[;\.]/
);
const predicateWithStringOrNumberValueRegex = new RegExp(
  /(\w+):(\w+)\s+("([^"]+)"|(\d+))\s*[;\.]/
);
const regexFormats = [
  prefixRegex,
  unknownPrefixRegexPattern,
  subjectWithTypeRegex,
  predicateWithNodeValueRegex,
  predicateWithStringOrNumberValueRegex,
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
