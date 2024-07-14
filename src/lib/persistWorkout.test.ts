import { defaultConfig } from "./config";
import { Database } from "./database";
import { parse } from "./parser";
import { PersistWorkout } from "./persistWorkout";

const parseWorkout = (input: string) => {
  const result = parse(input);
  const { errors } = result;
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }
  return result;
};

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

test("saves workout", async () => {
  await Database.initializeDatabase(":memory:", async (db) => {
    const fileName = "2023-09-24.gym";

    const ast = parseWorkout(workout1);
    await new PersistWorkout(db, defaultConfig).saveWorkout(fileName, ast);

    const wRows = await db.query<any>("select * from workout");
    const exRows = await db.query<any>("select * from exercise");
    const exIRows = await db.query<any>("select * from exercise_instance");
    const sRows = await db.query<any>('select * from "set"');
    expect(wRows.length).toBe(1);
    expect(wRows[0].file_name).toBe(fileName);
    expect(wRows[0].front_matter).toBe('{"hello":"world"}');
    expect(exRows.length).toBe(2);
    expect(exIRows.length).toBe(2);

    // this part tests the flattening behavior for both kinds of repeat sets
    expect(sRows.length).toBe(10);
  });
});

test("creates exercises correctly", async () => {
  await Database.initializeDatabase(":memory:", async (db) => {
    const persist = new PersistWorkout(db, defaultConfig);
    await persist.saveWorkout("2023-09-24.gym", parseWorkout(workout1));
    await persist.saveWorkout("2023-09-25.gym", parseWorkout(workout2));

    const exRows = await db.query<any>("select * from exercise");

    expect(exRows.length).toBe(3);
  });
});

test("removes workout", async () => {
  await Database.initializeDatabase(":memory:", async (db) => {
    const fileName = "2023-09-24.gym";

    const persist = new PersistWorkout(db, defaultConfig);
    await persist.saveWorkout(fileName, parseWorkout(workout1));
    await persist.deleteWorkout(fileName);

    const wRows = await db.query<any>("select * from workout");
    const exRows = await db.query<any>("select * from exercise");
    const exIRows = await db.query<any>("select * from exercise_instance");
    const sRows = await db.query<any>('select * from "set"');
    expect(wRows.length).toBe(0);
    expect(exRows.length).toBe(0);
    expect(exIRows.length).toBe(0);
    expect(sRows.length).toBe(0);
  });
});

test("overwrites workout", async () => {
  await Database.initializeDatabase(":memory:", async (db) => {
    const fileName = "2023-09-24.gym";

    const persist = new PersistWorkout(db, defaultConfig);
    await persist.saveWorkout(fileName, parseWorkout(workout1));
    await persist.saveWorkout(fileName, parseWorkout(workout2));

    const wRows = await db.query<any>("select * from workout");
    const exRows = await db.query<any>("select * from exercise");
    const exIRows = await db.query<any>("select * from exercise_instance");
    const sRows = await db.query<any>('select * from "set"');
    expect(wRows.length).toBe(1);
    expect(exRows.length).toBe(3);
    expect(exIRows.length).toBe(3);
    expect(sRows.length).toBe(8);
  });
});
