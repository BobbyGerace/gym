import { Database } from "../lib/database";
import mockFs from "mock-fs";
import { testConfig } from "../lib/config";
import { WorkoutController } from "./workout";

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

  # deadlift
  500x1@9

  # Front Squat
  300x5,6,7,8

  # Barbell Row
  135x12,12,12
`;

describe("WorkoutController", () => {
  beforeEach(() => {
    mockFs({
      workouts: {
        "2023-09-24.gym": workout1,
        "2023-09-26.gym": workout2,
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  test("save", async () => {
    await Database.initializeDatabase(":memory:", async (db) => {
      const fileName = "workouts/2023-09-24.gym";

      await new WorkoutController(testConfig).save([fileName]);

      const wRows = await db.query<any>("select * from workout");
      const exRows = await db.query<any>("select * from exercise");
      const exIRows = await db.query<any>("select * from exercise_instance");
      const sRows = await db.query<any>('select * from "set"');
      expect(wRows.length).toBe(1);
      expect(wRows[0].file_name).toBe("2023-09-24.gym");
      expect(wRows[0].front_matter).toBe('{"hello":"world"}');
      expect(exRows.length).toBe(2);
      expect(exIRows.length).toBe(2);

      // this part tests the flattening behavior for both kinds of repeat sets
      expect(sRows.length).toBe(10);
    });
  });
});
