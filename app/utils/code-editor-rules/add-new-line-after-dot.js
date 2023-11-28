export function addNewLineAfterDots(viewUpdate, startLineNumber = 1) {
  const totalLinesInEditor = viewUpdate.state.doc.lines;

  for (let index = 0; index < totalLinesInEditor; index++) {
    const currentLine = index + startLineNumber;

    addNewLineAfterDotForLine(currentLine, viewUpdate);
  }

  const firstLine = viewUpdate.state.doc.line(startLineNumber);
  viewUpdate.view.dispatch({
    selection: {
      anchor: firstLine.from,
      head: firstLine.from,
    },
  });
}

function addNewLineAfterDotForLine(line, viewUpdate) {
  let currentLine = null;
  let nextLine = null;
  try {
    currentLine = viewUpdate.state.doc.line(line);
    nextLine = viewUpdate.state.doc.line(currentLine.number + 1);
  } catch (error) {
    if (currentLine.text.trim() !== '') {
      viewUpdate.view.dispatch({
        changes: { from: currentLine.to, to: currentLine.to, insert: '\n' },
      });
    }

    return;
  }
  if (!nextLine) {
    return;
  }

  if (
    currentLine.text.trim().slice(-1) == '.' &&
    nextLine.text.trim() !== '' &&
    !nextLine.text.trim().startsWith('@prefix')
  ) {
    viewUpdate.view.dispatch({
      changes: { from: currentLine.to, to: currentLine.to, insert: '\n' },
    });
  }
}
