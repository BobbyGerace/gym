import {
  parseFrontMatterDelimiter,
  parseFrontMatterPair,
  parseFrontMatter,
} from "./frontMatter";
import { newState } from "./parserState";

const delimiter = newState(`---`);
test("parseFrontMatterDelimiter should parse ---", () => {
  expect(parseFrontMatterDelimiter(delimiter)).toBe(true);
});

test("parseFrontMatterDelimiter should correctly set state", () => {
  const state = newState(` --- `);
  expect(parseFrontMatterDelimiter(state)).toBe(true);
  expect(state).toEqual({ input: " --- ", pos: 5, line: 1, col: 6 });
});

const preWhitespace = newState(`  \t---`);
test("parseFrontMatterDelimiter should handle whitespace before", () => {
  expect(parseFrontMatterDelimiter(preWhitespace)).toBe(true);
});

const postWhitespace = newState(`---  \t`);
test("parseFrontMatterDelimiter should handle whitespace after", () => {
  expect(parseFrontMatterDelimiter(postWhitespace)).toBe(true);
});

const postComment = newState(`---  \t# comment`);
test("parseFrontMatterDelimiter should handle comment after", () => {
  expect(parseFrontMatterDelimiter(postComment)).toBe(true);
});

const extraDashes = newState(`------`);
test("parseFrontMatterDelimiter should handle 3+ dashes", () => {
  expect(parseFrontMatterDelimiter(extraDashes)).toBe(true);
});

const notEnoughDashes = newState(`--`);
test("parseFrontMatterDelimiter should handle 2 dashes", () => {
  expect(parseFrontMatterDelimiter(notEnoughDashes)).toBe(false);
});

const frontMatterLine = newState("hello123: world");
test('parseFrontMatterPair should parse "hello123: world"', () => {
  expect(parseFrontMatterPair(frontMatterLine)).toEqual(["hello123", "world"]);
});

const lineWithUnderscores = newState("hello_world: ayyyy lmao!");
test('parseFrontMatterPair should parse "hello_world: ayyyy lmao!"', () => {
  expect(parseFrontMatterPair(lineWithUnderscores)).toEqual([
    "hello_world",
    "ayyyy lmao!",
  ]);
});

const frontMatter = newState(`---
hello: hello_world
foo: bar
---`);
test("parseFrontMatter should parse front matter", () => {
  expect(parseFrontMatter(frontMatter)).toEqual({
    hello: "hello_world",
    foo: "bar",
  });
});

const frontMatterWithComments = newState(`---
hello: hello_world # yooo its a comment
# foo: bar
---`);
test("parseFrontMatter should parse front matter with comments", () => {
  expect(parseFrontMatter(frontMatterWithComments)).toEqual({
    hello: "hello_world",
  });
});

const frontMatterWithWeirdSpacing = newState(` --- 
  hello : hello_world
    foo   :   bar
  --- `);
test("parseFrontMatter should parse front matter with weird spacing", () => {
  expect(parseFrontMatter(frontMatterWithWeirdSpacing)).toEqual({
    hello: "hello_world",
    foo: "bar",
  });
});
