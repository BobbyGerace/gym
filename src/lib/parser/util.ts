import { ParserState } from "./parserState";

export const takeWhile = (
  state: ParserState,
  predicate: (char: string) => boolean
): string => {
  let result = "";
  while (state.pos < state.input.length && predicate(state.input[state.pos])) {
    result += state.input[state.pos];
    state.inc();
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
    state.inc();
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
  expect(state, "\n");
  state.incLine();
  return state.input.slice(start, state.pos);
};

export const parseIdentifier = (state: ParserState): string => {
  // Only allow identifiers to start with letters and underscore
  if (!/^[a-zA-Z_]$/.test(state.char())) {
    error(state, `Expected identifier but got ${state.char()}`);
  }
  const key = takeWhile(state, (char) => /[a-zA-Z0-9_-]/.test(char));
  return key;
};

export const error = (state: ParserState, message: string): void => {
  throw new Error(`${state.line}:${state.col} ${message}`);
};

export const expect = (state: ParserState, expected: string): void => {
  const actual = state.input[state.pos];
  if (actual !== expected) {
    const ex = expected === "\n" ? "newline" : expected;
    const act = actual === "\n" ? "newline" : actual;
    error(state, `Expected ${ex}, got ${act}`);
  }
  state.inc();
};

export const findNextLineStart = (state: ParserState): void => {
  whitespace(state);
  comment(state);
  if (state.input[state.pos] === "\n") {
    newLine(state);
    findNextLineStart(state);
    let str = "";
  }
};

export const parseString = (state: ParserState): string => {
  expect(state, '"');
  let result = "";
  while (state.pos < state.input.length && !/^["\n]/.test(state.char())) {
    if (state.char() === "\\") {
      state.inc();
      switch (state.char()) {
        case "n":
          result += "\n";
          break;
        case "r":
          result += "\r";
          break;
        case "t":
          result += "\t";
          break;
        case "v":
          result += "\v";
          break;
        case "f":
          result += "\f";
          break;
        case "b":
          result += "\b";
          break;
        case "\\":
          result += "\\";
          break;
        case '"':
          result += '"';
          break;
        default:
          result += state.char();
          break;
      }
    } else {
      result += state.char();
    }
    state.inc();
  }
  expect(state, '"');

  return result;
};

export const isValidNumber = (str: string): boolean => {
  return !isNaN(str as any) && !isNaN(parseFloat(str));
};
