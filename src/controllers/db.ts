import { Database } from "../lib/database";
import { Config } from "../lib/config";
import path from "path";
import fs from "fs";
import { yNPrompt } from "../lib/prompt";
import { PersistWorkout } from "../lib/persistWorkout";
import { parseOrThrow } from "../lib/parser";
import { findChangedFiles } from "../lib/findChangedFiles";
import { logger } from "../lib/logger";

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

    logger.log("Initializing database...");
    await Database.initializeDatabase(filePath);
    logger.log("Syncing database...");
    if (await this.sync({ yes: true })) {
      logger.log("Database successfully rebuilt.");
    }
  };

  sync = async (options: {
    yes?: boolean;
    silent?: boolean;
  }): Promise<boolean> => {
    const log: (s: string) => void =
      options.silent && options.yes ? (s) => {} : (s) => logger.log(s);

    return await Database.open(this.config.databaseFile, async (db) => {
      const { created, updated, deleted } = await findChangedFiles(
        this.config,
        db
      );

      if (deleted.length + updated.length + created.length === 0) {
        log("Already up to date.");
        return true;
      }

      log("The following changes will be made:");
      log(`  ${created.length} files created`);
      log(`  ${updated.length} files updated`);
      log(`  ${deleted.length} files deleted`);

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

      log("Database synced successfully.");
      return true;
    });
  };
}
