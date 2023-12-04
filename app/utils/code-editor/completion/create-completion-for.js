export function createCompletionsFor({ type, info, section, boost }, array) {
  return array.map((value) => {
    return {
      label: value,
      type: type,
      info: info,
      section: section,
      boost: boost,
    };
  });
}
