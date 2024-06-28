import { SetTokenizer } from "./SetTokenizer";
import { ParserState } from "../parserState";

describe("SetTokenizer", () => {
  function tokenize(input: string) {
    const tokenizer = new SetTokenizer(new ParserState(input));
    const tokens = [];
    let token;

    do {
      token = tokenizer.next();
      tokens.push(token);
    } while (token.type !== "eof");

    return tokens;
  }

  test("Basic number and operator", () => {
    const input = "130x15";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "number", value: "130", line: 1, col: 1 },
      { type: "operator", value: "x", line: 1, col: 4 },
      { type: "number", value: "15", line: 1, col: 5 },
      { type: "eof", value: "", line: 1, col: 7 },
    ]);
  });

  test("With a comment", () => {
    const input = "130x15 // This is a comment";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "number", value: "130", line: 1, col: 1 },
      { type: "operator", value: "x", line: 1, col: 4 },
      { type: "number", value: "15", line: 1, col: 5 },
      { type: "comment", value: "// This is a comment", line: 1, col: 8 },
      { type: "eof", value: "", line: 1, col: 28 },
    ]);
  });

  test("Complex set with time and operators", () => {
    const input = "150lb 00:13:02 x4 @10";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "number", value: "150", line: 1, col: 1 },
      { type: "identifier", value: "lb", line: 1, col: 4 },
      { type: "number", value: "00", line: 1, col: 7 },
      { type: "operator", value: ":", line: 1, col: 9 },
      { type: "number", value: "13", line: 1, col: 10 },
      { type: "operator", value: ":", line: 1, col: 12 },
      { type: "number", value: "02", line: 1, col: 13 },
      { type: "operator", value: "x", line: 1, col: 16 },
      { type: "number", value: "4", line: 1, col: 17 },
      { type: "operator", value: "@", line: 1, col: 19 },
      { type: "number", value: "10", line: 1, col: 20 },
      { type: "eof", value: "", line: 1, col: 22 },
    ]);
  });

  test("Mixed identifier and measurements", () => {
    // We stop at the beginning of the tag, because the tag tokenizer will handle the rest
    const input = "bwx150 40ft 3in {";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "identifier", value: "bw", line: 1, col: 1 },
      { type: "operator", value: "x", line: 1, col: 3 },
      { type: "number", value: "150", line: 1, col: 4 },
      { type: "number", value: "40", line: 1, col: 8 },
      { type: "identifier", value: "ft", line: 1, col: 10 },
      { type: "number", value: "3", line: 1, col: 13 },
      { type: "identifier", value: "in", line: 1, col: 14 },
      { type: "tagStart", value: "{", line: 1, col: 17 },
      { type: "eof", value: "", line: 1, col: 18 },
    ]);
  });
});
