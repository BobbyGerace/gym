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
  let sequence = -1;
  let subsequence = 0;
  while (!state.isEOF()) {
    const { line, col } = state;
    const { isSuperset, ...exercise } = parseExercise(state);
    if (isSuperset && exercises.length === 0) {
      state.error("First exercise cannot be a superset", line, col);
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
  return {
    frontMatter,
    exercises,
  };
};
