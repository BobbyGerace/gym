import { Database } from "../lib/database";
import { Config, defaultConfig } from "../lib/config";
import fs from "fs";
import { logger } from "../lib/logger";
import { toJson } from "../lib/toJson";

export class InitController {
  config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  init = async () => {
    if (!fs.existsSync("gymconfig.json")) {
      fs.writeFileSync("gymconfig.json", toJson(defaultConfig));
      logger.log("Created gymconfig.json");
    } else {
      logger.log("gymconfig.json already exists. Skipping creation.");
    }

    if (fs.existsSync(this.config.databaseFile)) {
      logger.log(
        "Database already exists. Use 'gym db rebuild' to delete and recreate."
      );
    } else {
      await Database.initializeDatabase(this.config.databaseFile);
      logger.log("Database Initialized.");
    }
  };
}
