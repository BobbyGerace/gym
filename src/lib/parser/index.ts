import { ExerciseParser } from "./ExerciseParser";
import { FrontMatterParser } from "./FrontMatterParser";
import { Exercise, Workout } from "./ast";
import { ParserState } from "./parserState";

export const parseWorkout = (workout: string): Workout => {
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

  if (state.errors.length) console.log(workout, state.errors);
  return {
    frontMatter,
    exercises,
  };
};
