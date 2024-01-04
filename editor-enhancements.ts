import {Editor, EditorPosition} from 'obsidian';

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

export class EditorExtensions {
  public static getSelectedText(editor: Editor): string {
    if (!editor.somethingSelected()) {
      let wordBoundaries = this.getWordBoundaries(editor);
      editor.setSelection(wordBoundaries.start, wordBoundaries.end);
    }
    return editor.getSelection();
  }

  private static cursorWithinBoundaries(cursor: EditorPosition, match: RegExpMatchArray): boolean {
    if (match.index === undefined) return false;
    let startIndex = match.index;
    let endIndex = match.index + match[0].length;

    return startIndex <= cursor.ch && cursor.ch <= endIndex;
  }

  private static getWordBoundaries(editor: Editor): WordBoundaries {
    let startCh, endCh: number;
    let cursor = editor.getCursor();

    // If its a normal URL token this is not a markdown link
    // In this case we can simply overwrite the link boundaries as-is
    let lineText = editor.getLine(cursor.line);

    // First check if we're in a link
    let linkLineRegex = /\[([^\[\]]*)\]\((https?:\/\/(?:www\.|(?!www))bilibili\.[^\s]{2,}|www\.bilibili\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))bilibili\.[^\s]{2,}|www\.bilibili\.[^\s]{2,})\)/gi
    let linksInLine = lineText.matchAll(linkLineRegex);

    for (let match of linksInLine) {
      if (this.cursorWithinBoundaries(cursor, match)) {
        if (match.index == undefined) return {
          start: cursor,
          end: cursor,
        };
        return {
          start: { line: cursor.line, ch: match.index },
          end: { line: cursor.line, ch: match.index + match[0].length },
        };
      }
    }

    // If not, check if we're in just a standard ol' URL.
    let lineRegex = /(https?:\/\/(?:www\.|(?!www))bilibili\.[^\s]{2,}|www\.bilibili\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))bilibili\.[^\s]{2,}|www\.bilibili\.[^\s]{2,})/gi
    let urlsInLine = lineText.matchAll(lineRegex);

    for (let match of urlsInLine) {
      if (this.cursorWithinBoundaries(cursor, match)) {
        if (match.index == undefined) return {
          start: cursor,
          end: cursor,
        };
        return {
          start: { line: cursor.line, ch: match.index },
          end: { line: cursor.line, ch: match.index + match[0].length },
        };
      }
    }

    return {
      start: cursor,
      end: cursor,
    };
  }
}
