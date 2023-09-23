import { parseWorkout } from "../parser";
import { query } from "../db";

export const saveWorkout = async (
  fileName: string,
  workout: string
): Promise<number> => {
  const document = parseWorkout(workout);
  const args = [
    fileName,
    JSON.stringify(document.frontMatter), // frontMatter
    new Date().toISOString(), // createdAt
    new Date().toISOString(), // updatedAt
  ];
  // TODO: delete workout if it already exists
  // TODO: handle errors

  // saves the workout to the database, returning the id
  // of the workout
  const rows = await query<{ id: number }>(
    `
      INSERT INTO workout (file_name, front_matter, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      RETURNING id;
    `,
    args
  );

  return rows[0].id;
};
