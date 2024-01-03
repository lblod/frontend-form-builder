export function addTabBeforeLineEndingOnSemiColon(line) {
  return new Promise((resolve) => {
    if (line.slice(-1) == ';') {
      resolve('\t' + line);
    }

    resolve(line);
  });
}
