import { Database } from "../lib/database";
import fs from "fs";
import mockFs from "mock-fs";
import { testConfig } from "../lib/config";
import { ExerciseController } from "./exercise";
import { DbController } from "./db";
import { Exercise } from "../lib/exercise";

const workout1 = `
  ---
  hello: world
  ---

  # Deadlift
  500x1@9

  # Barbell Row
  225x5,5,5 3 sets
`;

const workout2 = `
  ---
  hello: world
  ---

  # Lateral Raise
  20x10,10,10

  # Front Squat
  300x5,6,7,8

  # Barbell Row
  135x12,12,12
`;

const workout3 = `
  ---
  hello: world
  ---

  # Front Squat
  300x5,6,7,8

  & deadlift
  500x1@9

  # Barbell Row
  135x12,12,12
`;

describe("ExerciseController", () => {
  describe("rename", () => {
    beforeEach(() => {
      mockFs({
        workouts: {
          "2023-09-24.gym": workout1,
          "2023-09-26.gym": workout2,
          "2023-09-28.gym": workout3,
        },
      });
    });

    afterEach(() => {
      mockFs.restore();
    });

    test("renames the exercise", async () => {
      await Database.initializeDatabase(":memory:", async (db) => {
        await new DbController(testConfig).sync({ yes: true, silent: true });
        const exercise = new Exercise(testConfig, db);

        // Get deadlift for comparison later
        const deadliftOld = await exercise.getExerciseByName("Deadlift");
        expect(deadliftOld).not.toBeNull();
        if (!deadliftOld) throw "exercise not found";

        await new ExerciseController(testConfig).rename(
          "Deadlift",
          "Sumo Deadlift",
          {}
        );

        // Make sure dealift is properly cleared
        const deadlift = await exercise.getExerciseByName("Deadlift");
        expect(deadlift).toBeNull();

        // Make sure sumo exists
        const sumo = await exercise.getExerciseByName("Sumo Deadlift");
        expect(sumo).not.toBeNull();
        if (!sumo) throw "exercise not found";
        const sumoHistory = await exercise.getHistory(sumo.id, 100);
        expect(sumoHistory.length).toBe(2);

        // Make sure the id is the same
        expect(sumo.id).toBe(deadliftOld.id);

        // Make sure the files are properly replaced
        const file1: string = fs.readFileSync(
          "workouts/2023-09-24.gym",
          "utf-8"
        );
        expect(/^\s*# Sumo Deadlift/gim.test(file1)).toBe(true);
        expect(/^\s*# Deadlift/gim.test(file1)).toBe(false);

        const file3: string = fs.readFileSync(
          "workouts/2023-09-28.gym",
          "utf-8"
        );
        expect(/^\s*& Sumo Deadlift/m.test(file3)).toBe(true);
        expect(/^\s*& deadlift/m.test(file3)).toBe(false);

        // make sure file2 is untouched
        const file2: string = fs.readFileSync(
          "workouts/2023-09-26.gym",
          "utf-8"
        );
        expect(file2).toBe(workout2);
      });
    });

    test("Fails if the exercise already exists", async () => {
      await Database.initializeDatabase(":memory:", async (db) => {
        await new DbController(testConfig).sync({ yes: true, silent: true });
        const exercise = new Exercise(testConfig, db);

        // Get deadlift for comparison later
        const deadliftOld = await exercise.getExerciseByName("Deadlift");
        if (!deadliftOld) throw "exercise not found";

        await expect(
          async () =>
            await new ExerciseController(testConfig).rename(
              "Deadlift",
              "Front Squat",
              {}
            )
        ).rejects.toThrow(
          "Exercise already exists: Front Squat. Use --merge to merge histories"
        );
      });
    });

    test("merges if --merge is specified", async () => {
      await Database.initializeDatabase(":memory:", async (db) => {
        await new DbController(testConfig).sync({ yes: true, silent: true });
        const exercise = new Exercise(testConfig, db);

        // Make sure dealift is properly cleared
        const deadlift = await exercise.getExerciseByName("Deadlift");
        expect(deadlift).not.toBeNull();
        if (!deadlift) throw "exercise not found";

        // Make sure Front Squat exists
        const lateralRaise = await exercise.getExerciseByName("Lateral Raise");
        expect(lateralRaise).not.toBeNull();
        if (!lateralRaise) throw "exercise not found";

        await new ExerciseController(testConfig).rename(
          "Deadlift",
          "Lateral Raise",
          { merge: true }
        );

        // Make sure dealift is properly cleared
        const deadlift2 = await exercise.getExerciseByName("Deadlift");
        expect(deadlift2).toBeNull();

        const lateralRaiseHistory = await exercise.getHistory(
          lateralRaise.id,
          100
        );
        expect(lateralRaiseHistory.length).toBe(3);

        // Make sure the files are properly replaced
        const file1: string = fs.readFileSync(
          "workouts/2023-09-24.gym",
          "utf-8"
        );
        expect(/^\s*# Lateral Raise/gim.test(file1)).toBe(true);
        expect(/^\s*# Deadlift/gim.test(file1)).toBe(false);

        const file3: string = fs.readFileSync(
          "workouts/2023-09-28.gym",
          "utf-8"
        );
        expect(/^\s*& Lateral Raise/m.test(file3)).toBe(true);
        expect(/^\s*& deadlift/m.test(file3)).toBe(false);

        // make sure file2 is untouched
        const file2: string = fs.readFileSync(
          "workouts/2023-09-26.gym",
          "utf-8"
        );
        expect(file2).toBe(workout2);
      });
    });
  });
});
