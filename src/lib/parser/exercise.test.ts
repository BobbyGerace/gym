import { newState } from "./parserState";
import { parseExercise } from "./exercise";

const exercise = newState("# Bench Press");
test('parseExercise should parse "# Bench Press"', () => {
  expect(parseExercise(exercise)).toEqual({
    name: "Bench Press",
    isSuperset: false,
    sets: [],
    lineStart: 1,
    lineEnd: 1,
  });
});

const exerciseWithSubsequence = newState("& Bench Press");
test('parseExercise should parse "& Bench Press"', () => {
  expect(parseExercise(exerciseWithSubsequence)).toEqual({
    name: "Bench Press",
    isSuperset: true,
    sets: [],
    lineStart: 1,
    lineEnd: 1,
  });
});

const exerciseWithSubsequenceAndWhitespace = newState(" # Bench Press ");
test('parseExercise should parse " # Bench Press "', () => {
  expect(parseExercise(exerciseWithSubsequenceAndWhitespace)).toEqual({
    name: "Bench Press",
    isSuperset: false,
    sets: [],
    lineStart: 1,
    lineEnd: 1,
  });
});

const exerciseWithComment = newState("# Bench Press // comment");
test('parseExercise should parse "# Bench Press // comment"', () => {
  expect(parseExercise(exerciseWithComment)).toEqual({
    name: "Bench Press",
    isSuperset: false,
    sets: [],
    lineStart: 1,
    lineEnd: 1,
  });
});

const exerciseWithSpecialCharacters = newState("# 23 Bench-Press (Dumbbell)");
test('parseExercise should parse "# 23 Bench-Press (Dumbbell)"', () => {
  expect(parseExercise(exerciseWithSpecialCharacters)).toEqual({
    name: "23 Bench-Press (Dumbbell)",
    isSuperset: false,
    sets: [],
    lineStart: 1,
    lineEnd: 1,
  });
});

const exerciseWithSets = newState(`# Bench Press
100x2,3,4,5
300x4,5,6
34ft
bw x 5 @ 1`);
test("parseExercise should parse sets", () => {
  expect(parseExercise(exerciseWithSets)).toEqual({
    name: "Bench Press",
    isSuperset: false,
    lineStart: 1,
    lineEnd: 5,
    sets: [
      {
        weight: 100,
        reps: [2, 3, 4, 5],
      },
      {
        weight: 300,
        reps: [4, 5, 6],
      },
      {
        distance: { value: 34, unit: "ft" },
      },
      {
        weight: "bw",
        reps: [5],
        rpe: 1,
      },
    ],
  });
});

const exerciseWithSetsAndComments = newState(`# Bench Press //here
// and here
100x2,3,4,5 // and here
300x4,5,6

// and here

34ft
bw x 5 @ 1
// and here
# Hello world`);
test("parseExercise should parse sets with comments", () => {
  expect(parseExercise(exerciseWithSetsAndComments)).toEqual({
    name: "Bench Press",
    isSuperset: false,
    lineStart: 1,
    lineEnd: 10,
    sets: [
      {
        weight: 100,
        reps: [2, 3, 4, 5],
      },
      {
        weight: 300,
        reps: [4, 5, 6],
      },
      {
        distance: { value: 34, unit: "ft" },
      },
      {
        weight: "bw",
        reps: [5],
        rpe: 1,
      },
    ],
  });
});

// One day we should probably allow arbitrarly strings as exercise names
// but right now it's too hard to get the autocomplete/new exercise check to work
// correctly
// const exerciseWithString = newState(
//   '# "All kinds of \\n illegal {characters!}" '
// );
// test('parseExercise should parse string names"', () => {
//   expect(parseExercise(exerciseWithString)).toEqual({
//     name: "All kinds of \n illegal {characters!}",
//     isSuperset: false,
//     sets: [],
//     lineStart: 1,
//     lineEnd: 1,
//   });
// });
