import { Database } from "./database";

test("database works", async () => {
  await Database.initializeDatabase(":memory:", async (db) => {
    const rows = await db.query("select * from key_value");

    expect(rows.length).toBe(1);
  });
});
