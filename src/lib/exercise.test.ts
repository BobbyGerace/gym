import { Exercise } from "./exercise";
import { Database } from "./database";
import { PersistWorkout } from "./persistWorkout";
import { parseWorkout } from "./parser";
import { getConfig } from "./config";

const workouts = `315x10,8,6
335x8,4
365x5
275x8
405x3,2,2
500x1
455x1`
  .split("\n")
  .map((set) => `1) Deadlift\n${set}`);

test("getRepMaxPrs should get all rep max prs for an exercise", async () => {
  await Database.initializeDatabase(":memory:", async (db) => {
    const persist = new PersistWorkout(db);
    const exercise = new Exercise(getConfig(), db);
    for (let i = 0; i < workouts.length; i++) {
      const ast = parseWorkout(workouts[i]);
      await persist.saveWorkout(`2023-08-0${i + 1}.gym`, ast);
    }
    const exerciseId = (await exercise.getExerciseByName("Deadlift"))!.id;
    const prs = await exercise.getRepMaxPrs(exerciseId);

    expect(prs).toEqual([
      {
        reps: 1,
        actualReps: 1,
        date: "2023-08-06",
        weight: 500,
        weightUnit: null,
        workoutId: 6,
      },
      {
        reps: 2,
        actualReps: 2,
        date: "2023-08-05",
        weight: 405,
        weightUnit: null,
        workoutId: 5,
      },
      {
        reps: 3,
        actualReps: 3,
        date: "2023-08-05",
        weight: 405,
        weightUnit: null,
        workoutId: 5,
      },
      {
        reps: 4,
        actualReps: 5,
        date: "2023-08-03",
        weight: 365,
        weightUnit: null,
        workoutId: 3,
      },
      {
        reps: 5,
        actualReps: 5,
        date: "2023-08-03",
        weight: 365,
        weightUnit: null,
        workoutId: 3,
      },
      {
        reps: 6,
        actualReps: 8,
        date: "2023-08-02",
        weight: 335,
        weightUnit: null,
        workoutId: 2,
      },
      {
        reps: 7,
        actualReps: 8,
        date: "2023-08-02",
        weight: 335,
        weightUnit: null,
        workoutId: 2,
      },
      {
        reps: 8,
        actualReps: 8,
        date: "2023-08-02",
        weight: 335,
        weightUnit: null,
        workoutId: 2,
      },
      {
        reps: 9,
        actualReps: 10,
        date: "2023-08-01",
        weight: 315,
        weightUnit: null,
        workoutId: 1,
      },
      {
        reps: 10,
        actualReps: 10,
        date: "2023-08-01",
        weight: 315,
        weightUnit: null,
        workoutId: 1,
      },
    ]);
  });
});

test("getExerciseByName should get the exercise", async () => {
  await Database.initializeDatabase(":memory:", async (db) => {
    const persist = new PersistWorkout(db);
    const ex = new Exercise(getConfig(), db);
    for (let i = 0; i < workouts.length; i++) {
      const ast = parseWorkout(workouts[i]);
      await persist.saveWorkout(`2023-08-0${i + 1}.gym`, ast);
    }
    const exercise = await ex.getExerciseByName("Deadlift");

    expect(exercise).toEqual({ id: 1, name: "Deadlift" });
  });
});

test("getExerciseByName should be case insensitive", async () => {
  await Database.initializeDatabase(":memory:", async (db) => {
    const persist = new PersistWorkout(db);
    const ex = new Exercise(getConfig(), db);
    for (let i = 0; i < workouts.length; i++) {
      const ast = parseWorkout(workouts[i]);
      await persist.saveWorkout(`2023-08-0${i + 1}.gym`, ast);
    }
    const exercise = await ex.getExerciseByName("dEaDlIfT");

    expect(exercise).toEqual({ id: 1, name: "Deadlift" });
  });
});
