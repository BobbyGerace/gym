import { Database } from "../../lib/database";
import { parseWorkout } from "../../lib/parser";
import { PersistWorkout } from "./persist-workout";

const workout1 = `
  ---
  hello: world
  ---

  1) Deadlift
  500x1@9

  2) Barbell Row
  225x5,5,5
`;

const workout2 = `
  ---
  hello: world
  ---

  1) deadlift
  500x1@9

  2) Front Squat
  300x5,6,7,8

  3) Barbell Row
  135x12,12,12
`;

// TODO: move this to a database-specific test file
test("database works", async () => {
  const db = new Database(":memory:");
  await db.withSingleConnection(async () => {
    await db.initializeDatabase();
    const rows = await db.query("select * from key_value");

    expect(rows.length).toBe(1);
  });
});

test("saves workout", async () => {
  const db = new Database(":memory:");
  await db.withSingleConnection(async () => {
    await db.initializeDatabase();

    const fileName = "2023-09-24.gym";

    const ast = parseWorkout(workout1);
    await new PersistWorkout(db).saveWorkout(fileName, ast);

    const wRows = await db.query<any>("select * from workout");
    expect(wRows.length).toBe(1);
    expect(wRows[0].file_name).toBe(fileName);
    expect(wRows[0].front_matter).toBe('{"hello":"world"}');
  });
});

// test("creates exercises correctly", async () => {
//   const db = new Database(":memory:");
//   await db.withSingleConnection(async () => {
//     await db.initializeDatabase();
//     const fileName = "2023-09-24.gym";

//     const persist = new PersistWorkout(db);
//     await persist.saveWorkout(fileName, parseWorkout(workout1));
//     await persist.saveWorkout(fileName, parseWorkout(workout2));

//     const exRows = await db.query<any>("select * from exercise");

//     console.log(exRows);
//     expect(exRows.length).toBe(3);
//   });
// });

test("removes workout", () => {});

test("overwrites workout", () => {});