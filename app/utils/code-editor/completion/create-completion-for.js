export function createCompletionsFor({ type, info, section, boost }, array) {
  return array.map((prefix) => {
    return {
      label: prefix,
      type: type,
      info: info,
      section: section,
      boost: boost,
    };
  });
}
