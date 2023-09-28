import { Exercise } from "./exercise";
import { Database } from "./database";
import { PersistWorkout } from "./persistWorkout";
import { parseWorkout } from "./parser";

const workouts = `315x10,8,6
335x8,4
365x5
275x8
405x3,2,2
500x1
455x1`
  .split("\n")
  .map((set) => `1) Deadlift\n${set}`);

test("getRepMaxPrs should get all rep max prs for an exercise", () => {
  Database.initializeDatabase(":memory:", async (db) => {
    const persist = new PersistWorkout(db);
    const exercise = new Exercise(db);
    for (let i = 0; i < workouts.length; i++) {
      const ast = parseWorkout(workouts[i]);
      await persist.saveWorkout(`2023-08-0${i + 1}.gym`, ast);
    }
    const exerciseId = (await exercise.getExerciseByName("Deadlift")).id;
    const prs = exercise.getRepMaxPrs(exerciseId);

    expect(prs).toEqual([
      { reps: 1, date: new Date("2023-08-06"), weight: 500, workoutId: 6 },
      { reps: 2, date: new Date("2023-08-05"), weight: 405, workoutId: 5 },
      { reps: 3, date: new Date("2023-08-05"), weight: 405, workoutId: 5 },
      { reps: 4, date: new Date("2023-08-03"), weight: 365, workoutId: 3 },
      { reps: 5, date: new Date("2023-08-03"), weight: 365, workoutId: 3 },
      { reps: 6, date: new Date("2023-08-02"), weight: 335, workoutId: 2 },
      { reps: 7, date: new Date("2023-08-02"), weight: 335, workoutId: 2 },
      { reps: 8, date: new Date("2023-08-02"), weight: 335, workoutId: 2 },
      { reps: 9, date: new Date("2023-08-01"), weight: 315, workoutId: 1 },
      { reps: 10, date: new Date("2023-08-01"), weight: 315, workoutId: 1 },
    ]);
  });
});

test("getExerciseByName should get the exercise", () => {
  Database.initializeDatabase(":memory:", async (db) => {
    const persist = new PersistWorkout(db);
    const ex = new Exercise(db);
    for (let i = 0; i < workouts.length; i++) {
      const ast = parseWorkout(workouts[i]);
      await persist.saveWorkout(`2023-08-0${i + 1}.gym`, ast);
    }
    const exercise = await ex.getExerciseByName("Deadlift");

    expect(exercise).toEqual({ id: 1, name: "Deadlift" });
  });
});

test("getExerciseByName should be case insensitive", () => {
  Database.initializeDatabase(":memory:", async (db) => {
    const persist = new PersistWorkout(db);
    const ex = new Exercise(db);
    for (let i = 0; i < workouts.length; i++) {
      const ast = parseWorkout(workouts[i]);
      await persist.saveWorkout(`2023-08-0${i + 1}.gym`, ast);
    }
    const exercise = await ex.getExerciseByName("dEaDlIfT");

    expect(exercise).toEqual({ id: 1, name: "Deadlift" });
  });
});
