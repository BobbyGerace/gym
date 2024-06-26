import { TagParser } from "./TagParser";
import { ParserState } from "./parserState";

const newState = (input: string) => new ParserState(input);

const parseTags = (state: ParserState) => new TagParser(state).parse();

describe("TagParser", () => {
  const setWithQuotedTags = newState(`{one: "a", "two": b}`);
  test("parse should parse quoted tags", () => {
    expect(parseTags(setWithQuotedTags)).toEqual([
      { key: "one", value: "a" },
      { key: "two", value: "b" },
    ]);
  });

  const lotsOfTags = newState(`{one: a, two_, with-dash: -42.24}`);
  test("parse should parse lots of tags", () => {
    expect(parseTags(lotsOfTags)).toEqual([
      { key: "one", value: "a" },
      { key: "two_" },
      { key: "with-dash", value: -42.24 },
    ]);
  });

  const tagsWithStringKeys = newState(`{"one": a, "two": b}`);
  test("parse should parse string keys", () => {
    expect(parseTags(tagsWithStringKeys)).toEqual([
      { key: "one", value: "a" },
      { key: "two", value: "b" },
    ]);
  });

  const tagsWithBooleanValues = newState(`{one: true, two: false}`);
  test("parse should parse boolean values", () => {
    expect(parseTags(tagsWithBooleanValues)).toEqual([
      { key: "one", value: true },
      { key: "two", value: false },
    ]);
  });
});
