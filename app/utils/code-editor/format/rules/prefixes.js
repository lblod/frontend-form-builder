export async function formatPrefixes(line, nextLine) {
  return new Promise((resolve) => {
    if (line.startsWith(`@prefix`)) {
      if (nextLine && !nextLine.startsWith(`@prefix`)) {
        resolve(line + `\n`);
      }
    }

    resolve(line);
  });
}
