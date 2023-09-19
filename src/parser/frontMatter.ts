import { ParserState } from "./parserState";
import { takeWhile, whitespace, comment, newLine } from "./util";

export const parseFrontMatterDelimiter = (state: ParserState): boolean => {
  const start = state.pos;
  whitespace(state);
  const dashes = takeWhile(state, (char) => char === "-");
  if (dashes.length < 3) {
    state.pos = start;
    return false;
  }
  whitespace(state);
  comment(state);
  return true;
};

export const parseFrontMatterKey = (state: ParserState): string => {
  const start = state.pos;
  const key = takeWhile(state, (char) => /[a-zA-Z0-9_]/.test(char));
  state.pos = start + key.length;
  return key;
};

export const parseFrontMatterValue = (state: ParserState): string => {
  const start = state.pos;
  const value = takeWhile(state, (char) => !"\n#".includes(char));
  state.pos = start + value.length;
  return value;
};

export const parseFrontMatterPair = (state: ParserState): [string, string] => {
  const key = parseFrontMatterKey(state);
  whitespace(state);
  const colon = state.input[state.pos];
  if (colon !== ":") {
    throw new Error(`Expected colon, got ${colon}`);
  }
  state.pos++;
  state.col++;
  whitespace(state);
  comment(state);
  const value = parseFrontMatterValue(state);
  return [key, value];
};

export const parseFrontMatter = (
  state: ParserState
): Record<string, string> => {
  const start = state.pos;
  if (!parseFrontMatterDelimiter(state)) {
    state.pos = start;
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
  return pairs;
};
