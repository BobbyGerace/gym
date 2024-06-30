import { Database } from "./database";
import { Config } from "./config";
import path from "path";
import fs from "fs";
import { yNPrompt } from "./prompt";

export const findChangedFiles = async (
  config: Config,
  db: Database
): Promise<{ updated: string[]; created: string[]; deleted: string[] }> => {
  const workoutPath = path.join(process.cwd(), config.workoutDir);
  // check if the directory exists
  if (!fs.existsSync(workoutPath)) {
    throw new Error(`Workout directory not found: ${workoutPath}`);
  }

  const files = fs
    .readdirSync(workoutPath)
    .filter((d) => d.match(/^\d{4}-\d{2}-\d{2}.*\.gym$/));

  const lastDbUpdateByFileName = (
    await db.query<{ file_name: string; updated_at: string }>(
      "select file_name, updated_at from workout;"
    )
  ).reduce((map, row) => {
    map.set(row.file_name, new Date(row.updated_at));
    return map;
  }, new Map<string, Date>());

  const created: string[] = [];
  const updated: string[] = [];
  for (const file of files) {
    const { atimeMs, mtimeMs, ctimeMs } = fs.statSync(
      path.join(process.cwd(), config.workoutDir, file)
    );

    const lastFileModified = new Date(Math.max(atimeMs, mtimeMs, ctimeMs));
    const lastDbModified = lastDbUpdateByFileName.get(file);

    if (!lastDbModified) created.push(file);
    else if (lastFileModified >= lastDbModified) updated.push(file);

    lastDbUpdateByFileName.delete(file);
  }
  const deleted = [...lastDbUpdateByFileName.keys()];

  return { created, updated, deleted };
};

export const changedFilesPrompt = async (
  config: Config,
  db: Database
): Promise<boolean> => {
  const { updated, deleted, created } = await findChangedFiles(config, db);
  if (created.length + updated.length + deleted.length === 0) return false;

  console.log("The following unsaved changes were found");
  console.log(`  ${created.length} files created`);
  console.log(`  ${updated.length} files updated`);
  console.log(`  ${deleted.length} files deleted`);
  return await yNPrompt("Would you like to sync these files now?");
};
