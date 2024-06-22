import { ExerciseTokenizer } from "./ExerciseTokenizer";
import { ParserState } from "./parserState";

describe("ExerciseTokenizer", () => {
  function tokenize(input: string) {
    const tokenizer = new ExerciseTokenizer(new ParserState(input));
    const tokens = [];
    let token;

    do {
      token = tokenizer.next();
      tokens.push(token);
    } while (token.type !== "eof");

    return tokens;
  }

  test("Basic case", () => {
    const input = "# Bench Press";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "operator", value: "#", line: 1, col: 1 },
      { type: "exerciseName", value: "Bench Press", line: 1, col: 3 },
      { type: "eof", value: "", line: 1, col: 14 },
    ]);
  });

  test("With a comment", () => {
    const input = "# Bench Press // This is a comment";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "operator", value: "#", line: 1, col: 1 },
      { type: "exerciseName", value: "Bench Press", line: 1, col: 3 },
      { type: "comment", value: "// This is a comment", line: 1, col: 15 },
      { type: "eof", value: "", line: 1, col: 35 },
    ]);
  });

  test("Superset Syntax", () => {
    const input = "& Front Squat";
    const tokens = tokenize(input);
    expect(tokens).toEqual([
      { type: "operator", value: "&", line: 1, col: 1 },
      { type: "exerciseName", value: "Front Squat", line: 1, col: 3 },
      { type: "eof", value: "", line: 1, col: 14 },
    ]);
  });
});
