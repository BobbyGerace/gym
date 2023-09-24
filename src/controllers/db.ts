import { Database } from "../database";
import { Config } from "../config";

import fs from "fs";

export class DbController {
  db: Database;
  config: Config;
  constructor(config: Config, db: Database) {
    this.db = db;
    this.config = config;
  }

  rebuild() {
    const filePath = this.config.databaseFile;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    this.db.initializeDatabase();
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
