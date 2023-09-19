import { ParserState } from "./parserState";

export const takeWhile = (
  state: ParserState,
  predicate: (char: string) => boolean
): string => {
  let result = "";
  while (state.pos < state.input.length && predicate(state.input[state.pos])) {
    result += state.input[state.pos];
    state.pos++;
    state.col++;
  }
  return result;
};

export const takeUntil = (
  state: ParserState,
  predicate: (char: string) => boolean
): string => {
  let result = "";
  while (state.pos < state.input.length && !predicate(state.input[state.pos])) {
    result += state.input[state.pos];
    state.pos++;
    state.col++;
  }
  return result;
};

export const whitespace = (state: ParserState): string =>
  takeWhile(state, (char) => /[ \t]/.test(char));

export const comment = (state: ParserState): string => {
  if (state.input[state.pos] === "#") {
    return takeUntil(state, (char) => char === "\n");
  }
  return "";
};

export const newLine = (state: ParserState): string => {
  const start = state.pos;
  if (state.input[state.pos] !== "\n") {
    throw new Error(`Expected newline, got ${state.input[state.pos]}`);
  }
  state.pos++;
  state.line++;
  state.col = 1;
  return state.input.slice(start, state.pos);
};
