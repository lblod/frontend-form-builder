import dictionary from './dictionary';

export function completeWord(context) {
  let before = context.matchBefore(/\w+/);

  if (!context.explicit && !before) return null;

  return {
    from: before ? before.from : context.pos,
    options: dictionary,
    validFor: /\\b${before.text}\\b/,
  };
}
