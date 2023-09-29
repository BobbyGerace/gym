import { Database } from "../lib/database";
import { Config } from "../lib/config";
import path from "path";
import fs from "fs";
import { yNPrompt } from "../lib/prompt";

const asyncNoop = () => Promise.resolve();

export class DbController {
  config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  rebuild = async () => {
    const filePath = this.config.databaseFile;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Database.initializeDatabase(filePath);
    console.log("Database successfully rebuilt.");
  };

  init = async () => {
    if (fs.existsSync(this.config.databaseFile)) {
      console.log(
        "Database already exists. Use 'gym db rebuild' to delete and recreate."
      );
    } else {
      await Database.initializeDatabase(this.config.databaseFile);
      console.log("Database Initialized");
    }
  };

  sync = async () => {
    Database.open(this.config.databaseFile, async (db) => {
      const workoutPath = path.join(process.cwd(), this.config.workoutDir);
      const files = fs.readdirSync(workoutPath);

      const lastDbUpdateByFileName = (
        await db.query<{ file_name: string; updated_at: string }>(
          "select file_name, updated_at from workout;"
        )
      ).reduce((map, row) => {
        map.set(row.file_name, new Date(row.updated_at));
        return map;
      }, new Map<string, Date>());

      const toCreate = [];
      const toUpdate = [];
      for (const file of files) {
        const { atimeMs, mtimeMs, ctimeMs } = fs.statSync(
          path.join(process.cwd(), this.config.workoutDir, file)
        );

        const lastFileModified = new Date(Math.max(atimeMs, mtimeMs, ctimeMs));
        const lastDbModified = lastDbUpdateByFileName.get(file);

        if (!lastDbModified) toCreate.push(file);
        else if (lastFileModified >= lastDbModified) toUpdate.push(file);

        lastDbUpdateByFileName.delete(file);
      }

      const toDelete = [...lastDbUpdateByFileName.keys()];

      if (toDelete.length + toUpdate.length + toCreate.length === 0) {
        console.log("Already up to date.");
        return process.exit(0);
      }

      console.log("The following changes will be made:");
      console.log(`${toCreate.length} files created`);
      console.log(`${toUpdate.length} files updated`);
      console.log(`${toDelete.length} files deleted`);

      const confirmed = await yNPrompt("Continue?");

      if (!confirmed) return process.exit(0);

      console.log("ayyyy lmao");
    });
  };
}
