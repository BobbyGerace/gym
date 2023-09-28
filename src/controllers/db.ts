import { Database } from "../lib/database";
import { Config } from "../lib/config";

import fs from "fs";

const asyncNoop = () => Promise.resolve();

export class DbController {
  config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  async rebuild() {
    const filePath = this.config.databaseFile;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Database.initializeDatabase(filePath);
    console.log("Database successfully rebuilt.");
  }

  async init() {
    console.log("Initializing database...");
    if (fs.existsSync(this.config.databaseFile)) {
      console.log(
        "Database already exists. Use 'gym db rebuild' to delete and recreate."
      );
    } else {
      await Database.initializeDatabase(this.config.databaseFile);
    }
  }
}
