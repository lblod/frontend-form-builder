import dictionary from './dictionary';

export function completeWord(context) {
  let before = context.matchBefore(/\w+/);
  console.log(before);
  if (!context.explicit && !before) return null;
  return {
    from: before ? before.from : context.pos,
    options: dictionary,
    validFor: `/\\b${context.pos}\\b/`, // This has to be better somehow
  };
}
