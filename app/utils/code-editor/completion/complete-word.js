import dictionary from './dictionary';

export function completeWord(context) {
  let before = context.matchBefore(/\w+/);

  if (!context.explicit && !before) return null;
  return {
    from: before ? before.from : context.pos,
    options: dictionary,
    validFor: /\\b${context.text}\\b/, // This has to be better somehow
  };
}
