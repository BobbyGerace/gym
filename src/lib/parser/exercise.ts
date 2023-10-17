import { ParserState } from "./parserState";
import {
  comment,
  findNextLineStart,
  takeWhile,
  whitespace,
  expect,
  parseString,
  error,
} from "./util";
import { parseSet } from "./set";
import { Exercise, Set } from "./ast";

type InternalExercise = Omit<Exercise, "sequence" | "subsequence"> & {
  isSuperset: boolean;
};

const parseExStart = (state: ParserState): string => {
  let char = state.char();
  if (char !== "&" && char !== "#") {
    state.error(`Expected & or # but got ${char}`);
    char = "#";
  }

  state.inc();
  return char;
};

const parseName = (state: ParserState): string => {
  // One day we should probably allow arbitrarly strings as exercise names
  // but right now it's too hard to get the autocomplete/new exercise check to work
  // correctly
  // if (state.char() === '"') return parseString(state);

  const name = takeWhile(
    state,
    (char) => char !== "\n" && state.peek(2) !== "//"
  );
  return name.trim();
};

export const parseExercise = (state: ParserState): InternalExercise => {
  const lineStart = state.line;
  whitespace(state);
  const isSuperset = parseExStart(state) === "&";
  whitespace(state);
  const name = parseName(state);
  whitespace(state);
  comment(state);

  if (!state.isEOF() && state.char() !== "\n") {
    error(state, `Expected end of line but got ${state.char()}`);
  }

  findNextLineStart(state);

  const sets: Set[] = [];
  let lineEnd = state.line;
  while (state.pos < state.input.length) {
    if (isNewExercise(state)) {
      lineEnd = state.line - 1;
      break;
    }
    if (state.isEOF()) break;

    sets.push(parseSet(state));
    findNextLineStart(state);
    lineEnd = state.line;
  }

  return {
    name,
    isSuperset,
    sets,
    lineStart,
    lineEnd,
  };
};

const isNewExercise = (state: ParserState): boolean => {
  const rollback = state.save();
  whitespace(state);
  const isExercise = state.char() === "&" || state.char() === "#";
  rollback();
  return isExercise;
};
