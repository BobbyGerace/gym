import { newState } from "./parserState";
import { parseExercise } from "./exercise";

const exercise = newState("1) Bench Press\n");
test('parseExercise should parse "1) Bench Press"', () => {
  expect(parseExercise(exercise)).toEqual({
    name: "Bench Press",
    sequence: 1,
    subsequence: null,
    sets: [],
  });
});

const exerciseWithSubsequence = newState("1a) Bench Press\n");
test('parseExercise should parse "1a) Bench Press"', () => {
  expect(parseExercise(exerciseWithSubsequence)).toEqual({
    name: "Bench Press",
    sequence: 1,
    subsequence: "a",
    sets: [],
  });
});

const exerciseWithSubsequenceAndWhitespace = newState(" 1 a ) Bench Press \n");
test('parseExercise should parse " 1a ) Bench Press "', () => {
  expect(parseExercise(exerciseWithSubsequenceAndWhitespace)).toEqual({
    name: "Bench Press",
    sequence: 1,
    subsequence: "a",
    sets: [],
  });
});

const exerciseWithComment = newState("3b) Bench Press # comment\n");
test('parseExercise should parse "3b) Bench Press # comment"', () => {
  expect(parseExercise(exerciseWithComment)).toEqual({
    name: "Bench Press",
    sequence: 3,
    subsequence: "b",
    sets: [],
  });
});

const exerciseWithSpecialCharacters = newState(
  "3b) 23 Bench-Press (Dumbbell)\n"
);
test('parseExercise should parse "3b) 23 Bench-Press (Dumbbell)"', () => {
  expect(parseExercise(exerciseWithSpecialCharacters)).toEqual({
    name: "23 Bench-Press (Dumbbell)",
    sequence: 3,
    subsequence: "b",
    sets: [],
  });
});
