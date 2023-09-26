import { Database } from "../lib/database";
import { Config } from "../lib/config";

import fs from "fs";

export class DbController {
  config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  rebuild() {
    const filePath = this.config.databaseFile;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    Database.open(this.config.databaseFile, (db) => db.initializeDatabase());

    console.log("Database successfully rebuilt.");
  }

  init() {
    console.log("Initializing database...");
    if (fs.existsSync(this.config.databaseFile)) {
      console.log(
        "Database already exists. Use 'gym db rebuild' to delete and recreate."
      );
    } else {
      this.db.initializeDatabase();
    }
  }
}
