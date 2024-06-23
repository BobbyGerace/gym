import { Token } from "./AbstractTokenizer";
import {
  FrontMatterTokenType,
  FrontMatterTokenizer,
} from "./FrontMatterTokenizer";
import { ParserState } from "../parserState";

describe("FrontMatterTokenizer", () => {
  function tokenize(input: string) {
    const tokenizer = new FrontMatterTokenizer(new ParserState(input));
    const tokens: Token<FrontMatterTokenType>[] = [];
    let token;

    do {
      token =
        tokens[tokens.length - 1]?.type === "colon"
          ? tokenizer.nextTokenAfterColon()
          : tokenizer.next();
      tokens.push(token);
      if (token.type === "colon") {
      } else if (token.type === "newLine") {
      }
    } while (token.type !== "eof");

    return tokens;
  }

  test("Simple key-value pair", () => {
    const input = "hello: world\n";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "identifier", value: "hello", line: 1, col: 1 },
      { type: "colon", value: ":", line: 1, col: 6 },
      { type: "implicit", value: "world", line: 1, col: 8 },
      { type: "newLine", value: "\n", line: 1, col: 13 },
      { type: "eof", value: "", line: 2, col: 1 },
    ]);
  });

  test("Number value with comment", () => {
    const input = "good_day: 1234 // here's a comment\n";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "identifier", value: "good_day", line: 1, col: 1 },
      { type: "colon", value: ":", line: 1, col: 9 },
      { type: "implicit", value: "1234", line: 1, col: 11 },
      { type: "comment", value: "// here's a comment", line: 1, col: 16 },
      { type: "newLine", value: "\n", line: 1, col: 35 },
      { type: "eof", value: "", line: 2, col: 1 },
    ]);
  });

  test("Quoted keys and values with comment", () => {
    const input = '"keys can be strings": "And so can // values" //\n';
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "string", value: '"keys can be strings"', line: 1, col: 1 },
      { type: "colon", value: ":", line: 1, col: 22 },
      { type: "string", value: '"And so can // values"', line: 1, col: 24 },
      { type: "comment", value: "//", line: 1, col: 47 },
      { type: "newLine", value: "\n", line: 1, col: 49 },
      { type: "eof", value: "", line: 2, col: 1 },
    ]);
  });

  test("Kebab-case key with boolean value", () => {
    const input = "theres-even-kebab-case: true\n";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "identifier", value: "theres-even-kebab-case", line: 1, col: 1 },
      { type: "colon", value: ":", line: 1, col: 23 },
      { type: "implicit", value: "true", line: 1, col: 25 },
      { type: "newLine", value: "\n", line: 1, col: 29 },
      { type: "eof", value: "", line: 2, col: 1 },
    ]);
  });
});
