import path from "path";
import Handlebars from "handlebars";
import { writeFile, mkdir } from "../utils/io";
import { Modification } from "./modification";
import { parseDirectivesFromLines, BARE_WORD_ATTRIBUTE } from "./tag-utils";
import { scrive } from "./scrive";
import { fetchSnippet, writeSnippet } from "./snippets";

Handlebars.registerHelper("capitalise", function (aString) {
  return aString[0].toUpperCase() + aString.substring(1).toLowerCase();
});

export const DOWNSTREAM = "downstream";
export const DOWNSTREAM_BATCH = "downstream_batch";

export class Directive {
  static sourceModMemo = {};
  static refreshMemo = () => (Directive.sourceModMemo = {});

  static createBatch(codebase) {
    return codebase
      .reduce((acc, data) => {
        const { source, sourcePath } = data;

        acc.push(
          ...parseDirectivesFromLines(source.split("\n")).map((d) => ({
            ...d,
            sourcePath,
            source,
          }))
        );

        return acc;
      }, [])
      .map((d) => new Directive(d));
  }

  constructor({
    type,
    name,
    range,
    sourcePath,
    props,
    isSelfClosing,
    source,
    index,
  }) {
    this.index = index;
    this.type = type;
    this.name = name;
    this.range = range;
    this.sourcePath = sourcePath;
    this.source = source;
    this.bareWords = Object.keys(props).filter(
      (prop) => props[prop] === BARE_WORD_ATTRIBUTE
    );
    this.pathPattern =
      this.bareWords.indexOf(DOWNSTREAM) !== -1
        ? new RegExp("^" + path.dirname(sourcePath), "i")
        : new RegExp(sourcePath);
    this.props = props;
    this.isSelfClosing = isSelfClosing;

    this.astPart =
      this.bareWords[this.bareWords.indexOf(DOWNSTREAM) + 1] ||
      this.bareWords[0];
  }

  toString() {
    return `[${this.name}] (${this.type})`;
  }

  cacheKey = () => `${this.sourcePath}${this.astPart}${this.index}`;

  async test({ codebase, cache }) {
    console.log(`TEST: ${this.toString()}`);
    // get source
    let source, astPart, predicate, prop;

    if (this.bareWords.length === 0) return true;

    let result;

    if (this.bareWords.includes(DOWNSTREAM_BATCH)) {
      const sources = codebase
        .filter((data) => {
          const { sourcePath } = data;
          return (
            sourcePath.startsWith(path.dirname(this.sourcePath)) &&
            sourcePath !== this.sourcePath
          );
        })
        .map(({ source }) => source);

      source = "{\n" + sources.join("\n}\n{\n") + "\n}";
    }
    if (this.bareWords.includes(DOWNSTREAM)) {
      // TODO: get each query result with source path
      console.log("DOWNSTREAM");
      result = codebase
        .filter((data) => {
          const { sourcePath } = data;
          return (
            sourcePath.startsWith(path.dirname(this.sourcePath)) &&
            sourcePath !== this.sourcePath
          );
        })
        .map((data) => {
          return scrive({
            source: Directive.sourceModMemo[data.sourcePath] || data.source,
            sourcePath: data.sourcePath,
            astPart: this.astPart,
            predicate: () => true,
          });
        })
        .flat();
    } else if (!this.isSelfClosing) {
      const [start, end] = this.range;
      source = codebase
        .find(({ sourcePath }) => sourcePath === this.sourcePath)
        .source.split("\n")
        .slice(start + 1, end)
        .join("\n");

      astPart = this.astPart;
    }

    // run ast query
    console.log(this.name, this.astPart);
    !!result && console.log("HAS RESULT");
    result =
      result ||
      scrive({ source, astPart: this.astPart, predicate: () => true });

    const hasDiff = cache().get(this.cacheKey()) !== JSON.stringify(result);

    cache().set(this.cacheKey(), JSON.stringify(result));

    // fetch query from cache
    console.log({ hasDiff });
    this.result = result;

    return hasDiff ? result : false;
  }

  isTriggeredBy = (event) => event.name === this.name;

  async doWork(event) {
    console.log(`-> ${this.toString()} doing work. ${this.bareWords}`);
    const whereFilter = this.props.where || (() => true);

    if (this.props.fetchSnippet || this.props.snippet) {
      if (this.props.fetchSnippet) {
        let type;

        const source = Directive.sourceModMemo[this.sourcePath] || this.source;
        const res = await fetchSnippet(this.props.fetchSnippet);

        const fetchedSnippet = res.data;

        const resultsFilteredByWhereDirective =
          event.result.filter(whereFilter);

        const compiledSnippets =
          resultsFilteredByWhereDirective.length === 0
            ? ""
            : await Promise.all(
                resultsFilteredByWhereDirective.map(({ data }) =>
                  writeSnippet(fetchedSnippet[0], fetchedSnippet, [
                    {
                      snippetName: fetchedSnippet[0].snippetName,
                      args: {
                        ...data,
                        ...this.props,
                        dirPath: path.dirname(this.sourcePath),
                        relativePath:
                          data.sourcePath &&
                          path.basename(
                            path.relative(
                              path.dirname(this.sourcePath),
                              data.sourcePath
                            ),
                            path.extname(
                              path.relative(
                                path.dirname(this.sourcePath),
                                data.sourcePath
                              )
                            )
                          ),
                      },
                    },
                  ])
                )
              );
        const fetchSnippetWriteInstructions = compiledSnippets
          .map(({ instructions }) => instructions)
          .flat()
          .filter(({ type }) => type === "WRITE");

        const combinedSnippets = compiledSnippets
          .filter(({ localSnippet }) => localSnippet.trim().length > 0)
          .map(({ localSnippet }) => localSnippet)
          .join("\n");

        if (!this.isSelfClosing && this.bareWords.includes("overwrite")) {
          type = "overwrite_range";
        } else if (this.isSelfClosing) {
          if (this.bareWords.includes("overwrite_below")) {
            type = "overwrite_below";
          } else if (this.bareWords.includes("push_down")) {
            type = "push_down";
          } else if (this.bareWords.includes("push_up")) {
            type = "push_up";
          }
        }

        const toWrite = new Modification({
          type,
          content: combinedSnippets,
          index: this.index,
        }).execute(source);

        await writeFile(this.sourcePath, toWrite);

        console.log('Snippet will write ', fetchSnippetWriteInstructions.length, ' file(s) as a side effect')

        for (const writeInstruction of fetchSnippetWriteInstructions) {
          await mkdir(path.dirname(writeInstruction.path), { recursive: true })
          await writeFile(writeInstruction.path, writeInstruction.data)
        }

        Directive.sourceModMemo[this.sourcePath] = toWrite;
        return true;
      }

      if (this.props.snippet) {
        // Modify inline.
        let type;

        const source = Directive.sourceModMemo[this.sourcePath] || this.source;
        const template = Handlebars.compile(this.props.snippet);

        const resultsFilteredByWhereDirective =
          event.result.filter(whereFilter);

        const combinedSnippets =
          resultsFilteredByWhereDirective.length === 0
            ? ""
            : resultsFilteredByWhereDirective
                .map(({ data }) =>
                  template({
                    ...data,
                    ...this.props,
                    relativePath:
                      data.sourcePath &&
                      path.basename(
                        path.relative(
                          path.dirname(this.sourcePath),
                          data.sourcePath
                        ),
                        path.extname(
                          path.relative(
                            path.dirname(this.sourcePath),
                            data.sourcePath
                          )
                        )
                      ),
                  })
                )
                .join("\n");

        if (!this.isSelfClosing && this.bareWords.includes("overwrite")) {
          type = "overwrite_range";
        } else if (this.isSelfClosing) {
          if (this.bareWords.includes("overwrite_below")) {
            type = "overwrite_below";
          } else if (this.bareWords.includes("push_down")) {
            type = "push_down";
          } else if (this.bareWords.includes("push_up")) {
            type = "push_up";
          }
        }

        const toWrite = new Modification({
          type,
          content: combinedSnippets,
          index: this.index,
        }).execute(source);

        await writeFile(this.sourcePath, toWrite);
        Directive.sourceModMemo[this.sourcePath] = toWrite;
      }
    }

    return true;
  }
}
