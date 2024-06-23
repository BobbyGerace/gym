import { FrontMatterParser } from "./FrontMatterParser";
import { ParserState } from "./parserState";

describe("FrontMatterParser", () => {
  test("Basic case", () => {
    const input = `hello: world`;
    const parser = new FrontMatterParser(new ParserState(input));

    const result = parser.parse();
    expect(result).toEqual(["hello", "world"]);
  });

  test("Basic case", () => {
    const input = "good_day: 1234 // here's a comment\n";
    const parser = new FrontMatterParser(new ParserState(input));

    const result = parser.parse();
    expect(result).toEqual(["good_day", 1234]);
  });

  test("Basic case", () => {
    const input = '"keys can be strings": "And so can // values" //\n';
    const parser = new FrontMatterParser(new ParserState(input));

    const result = parser.parse();
    expect(result).toEqual(["keys can be strings", "And so can // values"]);
  });

  test("Basic case", () => {
    const input = "theres-even-kebab-case: true\n";
    const parser = new FrontMatterParser(new ParserState(input));

    const result = parser.parse();
    expect(result).toEqual(["theres-even-kebab-case", true]);
  });
});
