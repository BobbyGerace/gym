import { TagTokenizer } from "./TagTokenizer";
import { ParserState } from "../parserState";

describe("TagTokenizer", () => {
  function tokenize(input: string) {
    const tokenizer = new TagTokenizer(new ParserState(input));
    const tokens = [];
    let token;

    do {
      token = tokenizer.next();
      tokens.push(token);
    } while (token.type !== "eof");

    return tokens;
  }

  test("Single identifier", () => {
    const input = "{ hello }";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "tagStart", value: "{", line: 1, col: 1 },
      { type: "identifier", value: "hello", line: 1, col: 3 },
      { type: "tagEnd", value: "}", line: 1, col: 9 },
      { type: "eof", value: "", line: 1, col: 10 },
    ]);
  });

  test("Key-value pair with identifiers", () => {
    const input = "{ hello: world }";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "tagStart", value: "{", line: 1, col: 1 },
      { type: "identifier", value: "hello", line: 1, col: 3 },
      { type: "operator", value: ":", line: 1, col: 8 },
      { type: "identifier", value: "world", line: 1, col: 10 },
      { type: "tagEnd", value: "}", line: 1, col: 16 },
      { type: "eof", value: "", line: 1, col: 17 },
    ]);
  });

  test("Key-value pair with a number", () => {
    const input = "{ my_num: -0.123 }";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "tagStart", value: "{", line: 1, col: 1 },
      { type: "identifier", value: "my_num", line: 1, col: 3 },
      { type: "operator", value: ":", line: 1, col: 9 },
      { type: "number", value: "-0.123", line: 1, col: 11 },
      { type: "tagEnd", value: "}", line: 1, col: 18 },
      { type: "eof", value: "", line: 1, col: 19 },
    ]);
  });

  test("Strings with special characters", () => {
    const input = `{ "string key": "with a \\"stringy\\" value" }`;
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "tagStart", value: "{", line: 1, col: 1 },
      { type: "string", value: '"string key"', line: 1, col: 3 },
      { type: "operator", value: ":", line: 1, col: 15 },
      {
        type: "string",
        value: '"with a \\"stringy\\" value"',
        line: 1,
        col: 17,
      },
      { type: "tagEnd", value: "}", line: 1, col: 44 },
      { type: "eof", value: "", line: 1, col: 45 },
    ]);
  });

  test("Multiple keys and values", () => {
    const input = `{ hello: world, my-num: 3432, some_bool }`;
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "tagStart", value: "{", line: 1, col: 1 },
      { type: "identifier", value: "hello", line: 1, col: 3 },
      { type: "operator", value: ":", line: 1, col: 8 },
      { type: "identifier", value: "world", line: 1, col: 10 },
      { type: "operator", value: ",", line: 1, col: 15 },
      { type: "identifier", value: "my-num", line: 1, col: 17 },
      { type: "operator", value: ":", line: 1, col: 23 },
      { type: "number", value: "3432", line: 1, col: 25 },
      { type: "operator", value: ",", line: 1, col: 29 },
      { type: "identifier", value: "some_bool", line: 1, col: 31 },
      { type: "tagEnd", value: "}", line: 1, col: 41 },
      { type: "eof", value: "", line: 1, col: 42 },
    ]);
  });
});
