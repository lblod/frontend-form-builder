export function overwriteCustomSelectorComponentsForPreview(ttlCode) {
  const mapping = [
    {
      regex: /:conceptSchemeSelector/g,
      replacement: ':storeConceptSchemeSelector',
    },
  ];

  for (const map of mapping) {
    ttlCode = ttlCode.replace(map.regex, map.replacement);
  }

  return ttlCode;
}
