import { Exercise, Workout } from "./ast";
import { parseExercise } from "./exercise";
import { parseFrontMatter } from "./frontMatter";
import { ParserState } from "./parserState";
import { findNextLineStart } from "./util";

export const parseDocument = (state: ParserState): Workout => {
  findNextLineStart(state);
  const frontMatter =
    state.input[state.pos] === "-" ? parseFrontMatter(state) : {};
  findNextLineStart(state);
  const exercises: Exercise[] = [];
  while (!state.isEOF()) {
    exercises.push(parseExercise(state));
  }
  return {
    frontMatter,
    exercises,
  };
};
