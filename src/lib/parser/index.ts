import { ExerciseParser } from "./ExerciseParser";
import { FrontMatterParser } from "./FrontMatterParser";
import { ParseError, ParserState } from "./parserState";
import { Exercise, Set, Workout } from "./ast";
import { SetParser } from "./SetParser";

export { Exercise, Workout, FrontMatter, Set, Tag, Time } from "./ast";
export { ParseError } from "./parserState";

export const parse = (
  workout: string
): { result: Workout; errors: ParseError[] } => {
  const state = new ParserState(workout);
  const frontMatterParser = new FrontMatterParser(state);
  const exerciseParser = new ExerciseParser(state);

  frontMatterParser.skipToNextContent();
  const frontMatter = frontMatterParser.isFrontMatterDelimiter()
    ? frontMatterParser.parse()
    : {};

  exerciseParser.skipToNextContent();

  const exercises: Exercise[] = [];
  let sequence = -1;
  let subsequence = 0;
  while (!state.isEOF()) {
    const { line, col } = state;

    const parsedExercise = exerciseParser.parse();
    if (!parsedExercise) {
      continue;
    }
    let { isSuperset, ...exercise } = parsedExercise;

    if (isSuperset && exercises.length === 0) {
      state.error("First exercise cannot be a superset", line, col);
      isSuperset = false;
    }

    if (!isSuperset) {
      sequence++;
      subsequence = 0;
    } else {
      subsequence++;
    }

    exercises.push({
      ...exercise,
      sequence,
      subsequence,
    } as Exercise);
  }

  const result = {
    frontMatter,
    exercises,
  };

  return { result, errors: state.errors };
};

const formatError = (error: ParseError): string => {
  return `Parse error ${error.line}:${error.col}: ${error.message}`;
};

// TODO: Replace all usages of this with better error handling
export const parseOrThrow = (workout: string): Workout => {
  const { result, errors } = parse(workout);
  if (errors.length > 0) {
    throw new Error(errors.map(formatError).join("\n"));
  }
  return result;
};

export const parseSet = (
  set: string
): { result: Set; errors: ParseError[] } => {
  const state = new ParserState(set);

  const setParser = new SetParser(state);
  const result = setParser.parse();

  const errors = state.errors;

  return { result, errors };
};
