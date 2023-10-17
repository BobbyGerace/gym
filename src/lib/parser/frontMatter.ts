import { ParserState } from "./parserState";
import { FrontMatter } from "./ast";
import {
  takeWhile,
  whitespace,
  comment,
  newLine,
  parseIdentifier,
  expect,
  error,
  parseString,
  isValidNumber,
} from "./util";

export const parseFrontMatterDelimiter = (state: ParserState): boolean => {
  const dashes = takeWhile(state, (char) => char === "-");
  if (dashes.length < 3) {
    return false;
  }
  whitespace(state);
  comment(state);
  return true;
};

export const parseFrontMatterKey = (state: ParserState): string => {
  return state.char() === '"' ? parseString(state) : getIdentifierOrSkip(state);
};

const getIdentifierOrSkip = (state: ParserState): string => {
  const { line, col } = state;
  let identifier = parseIdentifier(state);
  if (identifier === null) {
    identifier = takeWhile(state, (char) => !"\n:".includes(char));
    state.error(
      `Expected identifier, got ${state.input[state.pos]}`,
      line,
      col,
      length
    );
  }
  return identifier;
};

export const parseFrontMatterValue = (state: ParserState): string => {
  if (state.char() === '"') return parseString(state);
  return takeWhile(state, (char) => char !== "\n" && state.peek(2) !== "//");
};

export const parseFrontMatterPair = (state: ParserState): [string, string] => {
  const key = parseFrontMatterKey(state);
  whitespace(state);
  expect(state, ":");
  whitespace(state);
  const value = parseFrontMatterValue(state);
  whitespace(state);
  comment(state);
  return [key, value];
};

export const parseFrontMatter = (state: ParserState): FrontMatter => {
  if (!parseFrontMatterDelimiter(state)) {
    return {};
  }
  newLine(state);
  whitespace(state);
  const pairs: FrontMatter = {};
  while (state.input.slice(state.pos, state.pos + 3) !== "---") {
    comment(state);
    if (state.input[state.pos] === "\n") {
      newLine(state);
      continue;
    }
    const [key, value] = parseFrontMatterPair(state);
    const trimmedValue = value.trim();

    pairs[key.trim()] = isValidNumber(trimmedValue)
      ? parseFloat(trimmedValue)
      : trimmedValue;
    whitespace(state);
    comment(state);
    newLine(state);
    whitespace(state);
  }
  if (!parseFrontMatterDelimiter(state)) {
    error(state, "Expected front matter delimiter");
  }
  return pairs;
};
