import { parseDocument } from "./document";
import { newState } from "./parserState";

const happyPath = newState(`---
title: Hello world
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
test("parseDocument should parse document", () => {
  expect(parseDocument(happyPath)).toEqual({
    frontMatter: {
      title: "Hello world",
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
test("parseDocument should parse document without frontmatter", () => {
  expect(parseDocument(withoutFrontMatter)).toEqual({
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
title: Hello world
date: 2020-01-01
---
`);
test("parseDocument should parse document without exercises", () => {
  expect(parseDocument(withoutExercises)).toEqual({
    frontMatter: {
      title: "Hello world",
      date: "2020-01-01",
    },
    exercises: [],
  });
});

const emptyDocument = newState(``);
test("parseDocument should parse empty document", () => {
  expect(parseDocument(emptyDocument)).toEqual({
    frontMatter: {},
    exercises: [],
  });
});

const withCommentsAndWhitespace = newState(`
// hello
--- // is anybody out there?
title: Hello world
 
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
test("parseDocument should parse with comments and empty lines", () => {
  expect(parseDocument(withCommentsAndWhitespace)).toEqual({
    frontMatter: {
      title: "Hello world",
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
