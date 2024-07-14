import { parse } from "./index";

const parseWorkout = (input: string) => {
  const result = parse(input);
  const { errors } = result;
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }
  return result;
};

const newState = (a: string) => a;

describe("parseWorkout", () => {
  const happyPath = newState(`---
  name: Hello world
  date: 2020-01-01
  ---

  # Bench Press
  // Felt good today
  225x10@9
  200x10,10,10

  # Lat Pulldown
  100x10,10,10

  & Dumbbell Bench Press
  50x10,10,10
   `);
  test("parseWorkout should parse document", () => {
    expect(parseWorkout(happyPath)).toEqual({
      frontMatter: {
        name: "Hello world",
        date: "2020-01-01",
      },
      exercises: [
        {
          name: "Bench Press",
          sequence: 0,
          subsequence: 0,
          lineStart: 6,
          lineEnd: 10,
          sets: [
            {
              weight: 225,
              reps: [10],
              rpe: 9,
            },
            {
              weight: 200,
              reps: [10, 10, 10],
            },
          ],
        },
        {
          name: "Lat Pulldown",
          sequence: 1,
          subsequence: 0,
          lineStart: 11,
          lineEnd: 13,
          sets: [
            {
              weight: 100,
              reps: [10, 10, 10],
            },
          ],
        },
        {
          name: "Dumbbell Bench Press",
          sequence: 1,
          subsequence: 1,
          lineStart: 14,
          lineEnd: 16,
          sets: [
            {
              weight: 50,
              reps: [10, 10, 10],
            },
          ],
        },
      ],
    });
  });

  const withoutFrontMatter = newState(`
  # Bench Press
  // Felt good today
  225x10@9
  200x10,10,10

  # Lat Pulldown
  100x10,10,10

  & Dumbbell Bench Press
  50x10,10,10
  `);
  test("parseWorkout should parse document without frontmatter", () => {
    expect(parseWorkout(withoutFrontMatter)).toEqual({
      frontMatter: {},
      exercises: [
        {
          name: "Bench Press",
          sequence: 0,
          subsequence: 0,
          lineStart: 2,
          lineEnd: 6,
          sets: [
            {
              weight: 225,
              reps: [10],
              rpe: 9,
            },
            {
              weight: 200,
              reps: [10, 10, 10],
            },
          ],
        },
        {
          name: "Lat Pulldown",
          sequence: 1,
          subsequence: 0,
          lineStart: 7,
          lineEnd: 9,
          sets: [
            {
              weight: 100,
              reps: [10, 10, 10],
            },
          ],
        },
        {
          name: "Dumbbell Bench Press",
          sequence: 1,
          subsequence: 1,
          lineStart: 10,
          lineEnd: 12,
          sets: [
            {
              weight: 50,
              reps: [10, 10, 10],
            },
          ],
        },
      ],
    });
  });

  const withoutExercises = newState(`---
  name: Hello world
  date: 2020-01-01
  ---
  `);
  test("parseWorkout should parse document without exercises", () => {
    expect(parseWorkout(withoutExercises)).toEqual({
      frontMatter: {
        name: "Hello world",
        date: "2020-01-01",
      },
      exercises: [],
    });
  });

  const emptyDocument = newState(``);
  test("parseWorkout should parse empty document", () => {
    expect(parseWorkout(emptyDocument)).toEqual({
      frontMatter: {},
      exercises: [],
    });
  });

  const withCommentsAndWhitespace = newState(`
  // hello
  --- // is anybody out there?
  name: Hello world
   
  // comments can go anywhere

  date: 2020-01-01
  ---

    // they can go here too

  # Bench Press
  // Felt good today
  225x10@9
  200x10,10,10

  # Lat Pulldown

  100x10,10,10 // comments on the sets!

  & Dumbbell Bench Press
  50x10,10,10
  //
  // even at the end!
   `);
  test("parseWorkout should parse with comments and empty lines", () => {
    const result = parseWorkout(withCommentsAndWhitespace);
    expect(result).toEqual({
      frontMatter: {
        name: "Hello world",
        date: "2020-01-01",
      },
      exercises: [
        {
          name: "Bench Press",
          sequence: 0,
          subsequence: 0,
          lineStart: 13,
          lineEnd: 17,
          sets: [
            {
              weight: 225,
              reps: [10],
              rpe: 9,
            },
            {
              weight: 200,
              reps: [10, 10, 10],
            },
          ],
        },
        {
          name: "Lat Pulldown",
          sequence: 1,
          subsequence: 0,
          lineStart: 18,
          lineEnd: 21,
          sets: [
            {
              weight: 100,
              reps: [10, 10, 10],
            },
          ],
        },
        {
          name: "Dumbbell Bench Press",
          sequence: 1,
          subsequence: 1,
          lineStart: 22,
          lineEnd: 26,
          sets: [
            {
              weight: 50,
              reps: [10, 10, 10],
            },
          ],
        },
      ],
    });
  });
});
