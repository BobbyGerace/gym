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

const parseSequence = (state: ParserState): number => {
  const sequence = takeWhile(state, (char) => /[0-9]/.test(char));
  return parseInt(sequence);
};

const parseSubsequence = (state: ParserState): string | null => {
  const subsequence = takeWhile(state, (char) => /[a-z]/.test(char));
  return subsequence || null;
};

const parseName = (state: ParserState): string => {
  // One day we should probably allow arbitrarly strings as exercise names
  // but right now it's too hard to get the autocomplete/new exercise check to work
  // correctly
  // if (state.char() === '"') return parseString(state);

  const name = takeWhile(state, (char) => /[^#\n{}]/.test(char));
  return name.trim();
};

export const parseExercise = (state: ParserState): Exercise => {
  const lineStart = state.line;
  whitespace(state);
  const sequence = parseSequence(state);
  whitespace(state);
  const subsequence = parseSubsequence(state);
  whitespace(state);
  expect(state, ")");
  state.inc();
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
    sequence,
    subsequence,
    sets,
    lineStart,
    lineEnd,
  };
};

const isNewExercise = (state: ParserState): boolean => {
  let isExercise = false;
  const rollback = state.save();
  whitespace(state);
  parseSequence(state);
  whitespace(state);
  parseSubsequence(state);
  whitespace(state);
  isExercise = state.input[state.pos] === ")";
  rollback();
  return isExercise;
};
