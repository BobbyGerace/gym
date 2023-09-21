import { ParserState } from "./parserState";
import {
  comment,
  findNextLineStart,
  takeWhile,
  whitespace,
  expect,
} from "./util";
import { Set, parseSet } from "./set";

export type Exercise = {
  name: string;
  sequence: number;
  subsequence: string | null;
  sets: Set[];
  lineStart: number;
  lineEnd: number;
};

const parseSequence = (state: ParserState): number => {
  const sequence = takeWhile(state, (char) => /[0-9]/.test(char));
  return parseInt(sequence);
};

const parseSubsequence = (state: ParserState): string | null => {
  const subsequence = takeWhile(state, (char) => /[a-z]/.test(char));
  return subsequence || null;
};

const parseName = (state: ParserState): string => {
  const name = takeWhile(state, (char) => /[^#\n]/.test(char));
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
  comment(state);

  findNextLineStart(state);

  const sets: Set[] = [];
  let lineEnd = state.line;
  while (true) {
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
