import { ParserState } from "./parserState";
import { comment, newLine, takeWhile, whitespace } from "./util";

export type Exercise = {
  name: string;
  sequence: number;
  subsequence: string | null;
  sets: Set[];
};

const parseSequence = (state: ParserState): number => {
  const start = state.pos;
  const sequence = takeWhile(state, (char) => /[0-9]/.test(char));
  state.pos = start + sequence.length;
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
  whitespace(state);
  const sequence = parseSequence(state);
  whitespace(state);
  const subsequence = parseSubsequence(state);
  whitespace(state);
  if (state.input[state.pos] !== ")") {
    throw new Error(`Expected ), got ${state.input[state.pos]}`);
  }
  state.pos++;
  whitespace(state);
  const name = parseName(state);
  comment(state);
  newLine(state);

  return {
    name,
    sequence,
    subsequence,
    sets: [],
  };
};

const prefixOperators = "x@".split("");
const infixOperators = ":".split("");
const postfixOperators = ["ft", "mi", "m", "km"];

// handles negatives and decimals
const parseNumber = (state: ParserState): number => {
  const start = state.pos;
  const number = takeWhile(state, (char) => /[0-9.-]/.test(char));
  state.pos = start + number.length;
  return parseFloat(number);
};

const parseValue = (state: ParserState): number => {
  if (state.input.slice(state.pos, state.pos + 2) === "bw") {
    state.pos += 2;
    return 0;
  }
  return parseNumber(state);
};

const parsePrefixOperator = (state: ParserState): string | null => {
  const operator = takeWhile(state, (char) => prefixOperators.includes(char));
  return operator || null;
};

const parseInfixOperator = (state: ParserState): string | null => {
  const operator = takeWhile(state, (char) => infixOperators.includes(char));
  return operator || null;
};

const parsePostfixOperator = (state: ParserState): string | null => {
  const operator = takeWhile(state, (char) => /[a-zA-Z]/.test(char));
  if (!postfixOperators.includes(operator)) {
    return null;
  }
  return operator || null;
};

type Set = Partial<{
  weight: number;
  reps: number;
  rpe: number;
  distance: number;
  time: number;
  tags: Tag[];
}>;

type Tag = { key: string; value: string };

const parseSet = (state: ParserState): Set => {
  whitespace(state);
  const prefixOperator = parsePrefixOperator(state);
  if (prefixOperator) {
    whitespace(state);
    parseValue(state);
    const value = parseValue(state);
    if (!value) {
      throw new Error(`Expected value, got ${state.input[state.pos]}`);
    }

    let set: Set = {};
    if (prefixOperator === "x") set.reps = value;
    else if (prefixOperator === "@") set.rpe = value;
    else throw new Error(`Unexpected prefix operator ${prefixOperator}`);

    return { ...set, ...parseSet(state) };
  } else {
    const value = parseValue(state);
    if (!value) {
      throw new Error(`Expected value, got ${state.input[state.pos]}`);
    }
    whitespace(state);

    // TODO: handle infix operators
    // TODO: handle postfix operators
    // TODO: handle tags
    // TODO: handle comments
  }
};
