import { FrontMatterParser } from "./FrontMatterParser";
import { ParserState } from "./parserState";

describe("FrontMatterParser", () => {
  const newState = (input: string) => new ParserState(input);

  test("Basic case", () => {
    const input = `hello: world`;
    const parser = new FrontMatterParser(new ParserState(input));

    const result = parser.parseLine();
    expect(result).toEqual(["hello", "world"]);
  });

  test("Number with comment case", () => {
    const input = "good_day: 1234 // here's a comment\n";
    const parser = new FrontMatterParser(new ParserState(input));

    const result = parser.parseLine();
    expect(result).toEqual(["good_day", 1234]);
  });

  test("String keys and values", () => {
    const input = '"keys can be \\t strings": "And so can // values" //\n';
    const parser = new FrontMatterParser(new ParserState(input));

    const result = parser.parseLine();
    expect(result).toEqual(["keys can be \t strings", "And so can // values"]);
  });

  test("Hyphens in key", () => {
    const input = "theres-even-kebab-case: true\n";
    const state = new ParserState(input);
    const parser = new FrontMatterParser(state);

    const result = parser.parseLine();

    expect(result).toEqual(["theres-even-kebab-case", true]);
  });

  const frontMatter = newState(`---
  hello: hello_world
  foo: bar
  ---`);
  test("parse should parse front matter", () => {
    expect(new FrontMatterParser(frontMatter).parse()).toEqual({
      hello: "hello_world",
      foo: "bar",
    });
  });

  const frontMatterWithComments = newState(`---
  hello: hello_world // yooo its a comment
  // foo: bar
  ---`);
  test("parse should parse front matter with comments", () => {
    expect(new FrontMatterParser(frontMatterWithComments).parse()).toEqual({
      hello: "hello_world",
    });
  });

  const frontMatterWithWeirdSpacing = newState(`--- 
    hello : hello_world
      foo   :   bar
    --- `);
  test("parse should parse front matter with weird spacing", () => {
    expect(new FrontMatterParser(frontMatterWithWeirdSpacing).parse()).toEqual({
      hello: "hello_world",
      foo: "bar",
    });
  });

  // const frontMatterWithoutEndDelimiter = newState(`---
  // hello: hello_world
  // foo: bar

  // `);
  // test("parse should error without end delimiter", () => {
  //   expect(() =>
  //     new FrontMatterParser(frontMatterWithoutEndDelimiter).parse()
  //   ).toThrow();
  // });

  // const frontMatterWithoutColon = newState(`---
  // hello there
  // ---`);
  // test("parse should error without colon", () => {
  //   expect(() =>
  //     new FrontMatterParser(frontMatterWithoutColon).parse()
  //   ).toThrow();
  // });

  const frontMatterWithStrings = newState(`---
  "hello\\\\there": hello_world
  foo: "bar with a \\n new line" // and a comment
  ---`);
  test("parse should parse strings", () => {
    expect(new FrontMatterParser(frontMatterWithStrings).parse()).toEqual({
      "hello\\there": "hello_world",
      foo: "bar with a \n new line",
    });
  });

  const frontMatterWithNumber = newState(`---
  hello: hello_world
  foo: -42.3
  ---`);
  test("parse should parse numbers", () => {
    expect(new FrontMatterParser(frontMatterWithNumber).parse()).toEqual({
      hello: "hello_world",
      foo: -42.3,
    });
  });
});
