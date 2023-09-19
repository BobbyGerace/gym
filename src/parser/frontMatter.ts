import { ParserState } from "./parserState";
import {
  takeWhile,
  whitespace,
  comment,
  newLine,
  parseIdentifier,
  expect,
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

export const parseFrontMatterKey = parseIdentifier;

export const parseFrontMatterValue = (state: ParserState): string =>
  takeWhile(state, (char) => !"\n#".includes(char));

export const parseFrontMatterPair = (state: ParserState): [string, string] => {
  const key = parseFrontMatterKey(state);
  whitespace(state);
  expect(state, ":");
  whitespace(state);
  comment(state);
  const value = parseFrontMatterValue(state);
  return [key, value];
};

export const parseFrontMatter = (
  state: ParserState
): Record<string, string> => {
  if (!parseFrontMatterDelimiter(state)) {
    return {};
  }
  newLine(state);
  whitespace(state);
  const pairs: Record<string, string> = {};
  while (state.input.slice(state.pos, state.pos + 3) !== "---") {
    comment(state);
    if (state.input[state.pos] === "\n") {
      newLine(state);
      continue;
    }
    const [key, value] = parseFrontMatterPair(state);
    pairs[key.trim()] = value.trim();
    whitespace(state);
    comment(state);
    newLine(state);
    whitespace(state);
  }
  if (!parseFrontMatterDelimiter(state)) {
    throw new Error("Expected front matter delimiter");
  }
  return pairs;
};
