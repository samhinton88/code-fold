import { isClosingLine, isLineWithDirective } from "./tag-utils";
/* 
  Producers - listen for changes in code and emit events.
    AST_PART
      identifiers, functions etc.
    predicates 
      unique name, startswith, endswith
    ranges
      "downstream" - query all code in lower dirs
      implied by opening and closing tags
    aliases
      names which expand to AST_PARTs and predicates
  Consumers - listen for events and create modifications
    snippets
    modifications
      overwrite below
      writes between boundaries implied

*/
const types = ["overwrite_range", "overwrite_below"];

export class Modification {
  static cache = [];
  constructor({ source, type, content, index }) {
    this.index = index;
    this.content = content;
    this.source = source;
    this.type = type;
  }

  execute(targetFile) {
    let targetAsLines, openingTagPositions, start, end;

    targetAsLines = targetFile.split("\n");
    openingTagPositions = targetAsLines
          .map((line, i) => {
            return isLineWithDirective(line) && !isClosingLine(line)
              ? i
              : false;
          })
          .filter((num) => num !== false);

    start = openingTagPositions[this.index];
    // TODO: make this smarter as it breaks nesting directives
    end = targetAsLines.slice(start).findIndex(isClosingLine) + start;
    const linesToAdd = this.content.split("\n");

    switch (this.type) {
      case "overwrite_range":
        return [
          ...targetAsLines.slice(0, start + 1),
          ...linesToAdd,
          ...targetAsLines.slice(end),
        ].join("\n");
      case "overwrite_below":
        return [
          ...targetAsLines.slice(0, start + 1),
          ...linesToAdd,
        ].join("\n");
      case "push_down":
          return [
            ...targetAsLines.slice(0, start + 1),
            ...linesToAdd,
            ...targetAsLines.slice(start + 1)
          ].join("\n");
      case "push_up":
        return [
          ...targetAsLines.slice(0, start),
          ...linesToAdd,
          ...targetAsLines.slice(start)
        ].join("\n");
      default:
        throw new Error("unknown modification type");
    }
  }
}
