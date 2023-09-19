import { Exercise, parseExercise } from "./exercise";
import { parseFrontMatter } from "./frontMatter";
import { ParserState } from "./parserState";
import { findNextLineStart } from "./util";

export type Document = {
  frontMatter: Record<string, string>;
  exercises: Exercise[];
};

export const parseDocument = (state: ParserState): Document => {
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
