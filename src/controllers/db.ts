import { Database } from "../lib/database";
import { Config } from "../lib/config";
import path from "path";
import fs from "fs";
import { yNPrompt } from "../lib/prompt";
import { PersistWorkout } from "../lib/persistWorkout";
import { parseOrThrow } from "../lib/parser";
import { findChangedFiles } from "../lib/findChangedFiles";

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

    console.log("Initializing database...");
    await Database.initializeDatabase(filePath);
    console.log("Syncing database...");
    if (await this.sync({ yes: true })) {
      console.log("Database successfully rebuilt.");
    }
  };

  init = async () => {
    if (fs.existsSync(this.config.databaseFile)) {
      console.log(
        "Database already exists. Use 'gym db rebuild' to delete and recreate."
      );
    } else {
      await Database.initializeDatabase(this.config.databaseFile);
      console.log("Database Initialized.");
    }
  };

  sync = async (options: { yes: boolean }): Promise<boolean> => {
    return await Database.open(this.config.databaseFile, async (db) => {
      const { created, updated, deleted } = await findChangedFiles(
        this.config,
        db
      );

      if (deleted.length + updated.length + created.length === 0) {
        console.log("Already up to date.");
        return true;
      }

      console.log("The following changes will be made:");
      console.log(`  ${created.length} files created`);
      console.log(`  ${updated.length} files updated`);
      console.log(`  ${deleted.length} files deleted`);

      const confirmed = options.yes || (await yNPrompt("Continue?"));
      if (!confirmed) return false;

      const persist = new PersistWorkout(db, this.config);
      for (const file of deleted) {
        await persist.deleteWorkout(file);
      }
      for (const file of updated.concat(created)) {
        try {
          const fileName = path.join(
            process.cwd(),
            this.config.workoutDir,
            file
          );
          const ast = parseOrThrow(fs.readFileSync(fileName, "utf-8"));
          await persist.saveWorkout(file, ast);
        } catch (e) {
          if (e instanceof Error)
            throw new Error(`Problem saving file ${file}: ${e.message}`);
          else throw e;
        }
      }

      console.log("Database synced successfully.");
      return true;
    });
  };
}
