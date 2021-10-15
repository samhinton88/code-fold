import {
  leadingTag,
  isClosingLineFor,
  parseDirectivesFromLines,
  Directive,
  getProps,
  splitByWhitespaceButNotInQuotes,
  BARE_WORD_ATTRIBUTE,
} from "./directive";

describe("leadingTag", () => {
  it("should return the opening tag of a directive", () => {
    expect(leadingTag("// <Foo />")).toBe("Foo");
  });

  it("should return the opening tag of a directive with a star if present", () => {
    expect(leadingTag("// <*Foo />")).toBe("*Foo");
  });
});

describe("isClosingLineFor", () => {
  it("should correctly identify a closing tag", () => {
    expect(isClosingLineFor("Foo")("// </Foo>")).toBe(true);
  });

  it("should correctly identify a closing tag with trailing whitespace", () => {
    expect(isClosingLineFor("Foo")("// </Foo  >")).toBe(true);
  });

  it("should not misidentify opening tags", () => {
    expect(isClosingLineFor("Foo")("// <Foo  >")).toBe(false);
  });
});

describe("parseDirectivesFromLines", () => {
  it("should pick directives from a file split by newline", () => {
    const script = `// <FOO fat_arrow_function unique name>
let varInFooScope = 0;
const foo = () => {}
const bar = () => {}
// </FOO>

// <*FOO snippet="describe('{{ name }}', () => {})">
// </*FOO>`;

    expect(parseDirectivesFromLines(script.split("\n"))).toEqual([
      {
        name: "FOO",
        type: "producer",
        range: [0, 4],
        props: {
          fat_arrow_function: BARE_WORD_ATTRIBUTE,
          name: BARE_WORD_ATTRIBUTE,
          unique: BARE_WORD_ATTRIBUTE,
        },
      },
      {
        name: "FOO",
        type: "consumer",
        range: [6, 7],
        props: { snippet: "describe('{{ name }}', () => {})" },
      },
    ]);
  });
});

describe("Directive.createBatch", () => {
  it("should return an array of directives from a source codebase", () => {
    const script = `// <FOO fat_arrow_function unique name>
let varInFooScope = 0;
const foo = () => {}
const bar = () => {}
// </FOO>

// <*FOO snippet="describe('{{ name }}', () => {})">
// </*FOO>`;
    const codebase = [{ source: script, sourceFile: "/foo/bar.js" }];

    expect(Directive.createBatch(codebase)).toEqual([
      {
        name: "FOO",
        range: [0, 4],
        sourceFile: "/foo/bar.js",
        type: "producer",
        props: {
          fat_arrow_function: BARE_WORD_ATTRIBUTE,
          name: BARE_WORD_ATTRIBUTE,
          unique: BARE_WORD_ATTRIBUTE,
        },
      },
      {
        name: "FOO",
        range: [6, 7],
        sourceFile: "/foo/bar.js",
        type: "consumer",
        props: { snippet: "describe('{{ name }}', () => {})" },
      },
    ]);
  });
});

describe("getProps", () => {
  it("should parse properties from directive", () => {
    expect(getProps('<Foo foo="bar" count={11} isOk={true} />')).toEqual({
      foo: "bar",
      count: 11,
      isOk: true,
    });
  });

  it("should ignore properties without an assignment operator", () => {
    expect(getProps('<Foo foo="bar" baz count={11} isOk={true} />')).toEqual({
      foo: "bar",
      count: 11,
      isOk: true,
      baz: BARE_WORD_ATTRIBUTE,
    });
  });
});
