import { parseString } from "./util";
import { newState } from "./parserState";

test("parses double quote string", () => {
  expect(parseString(newState('"hello world!"'))).toBe("hello world!");
});

test("parses empty string", () => {
  expect(parseString(newState('""'))).toBe("");
});

test("Does not allow newlines", () => {
  expect(() =>
    parseString(
      newState(`"hello
                             world"`)
    )
  ).toThrow();
});

test("escapes correctly", () => {
  expect(parseString(newState('"\\n\\r\\t\\v\\f\\b\\\\\\""'))).toBe(
    '\n\r\t\v\f\b\\"'
  );
});
