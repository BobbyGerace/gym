import sqlite3 from "sqlite3";
import { getConfig } from "../config";
import { yNPrompt } from "../prompt";
import fs from "fs";

const DB_VERSION = 1;

export const initializeDatabase = (filePath: string): void => {
  const db = new sqlite3.Database(filePath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      return;
    }

    // Create tables
    db.serialize(() => {
      // workout table - id autoincrements
      db.run(`
        CREATE TABLE workout (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_name TEXT,
          front_matter JSON,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(file_name)
        );
      `);

      // exercise table
      db.run(`
        CREATE TABLE exercise (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL
        );
      `);

      // exercise_instance table
      db.run(`
        CREATE TABLE exercise_instance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          exercise_id INTEGER,
          sequence INTEGER NOT NULL,
          subsequence TEXT,
          line_start INTEGER NOT NULL,
          line_end INTEGER NOT NULL,
          workout_id INTEGER,
          FOREIGN KEY(exercise_id) REFERENCES exercise(id),
          FOREIGN KEY(workout_id) REFERENCES workout(id)
        );
      `);

      // set table
      db.run(`
        CREATE TABLE exercise_set (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          weight_value REAL,
          weight_unit TEXT,
          reps INTEGER,
          rpe REAL,
          distance_value REAL,
          distance_unit TEXT,
          hours INTEGER,
          minutes INTEGER,
          seconds INTEGER,
          tags JSON,
          exercise_instance_id INTEGER,
          FOREIGN KEY(exercise_instance_id) REFERENCES exercise_instance(id)
        );
      `);

      db.run(`
        CREATE TABLE key_value (
          key TEXT PRIMARY KEY,
          value JSON
        );
      `);

      // Insert DB_VERSION
      db.run(`
        INSERT INTO key_value (key, value)
        VALUES ('db_version', ${DB_VERSION});
      `);
    });

    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Successfully initialized database.");
      }
    });
  });
};

let db: sqlite3.Database | null = null;

const dbFileExists = (): boolean => {
  const config = getConfig();
  return fs.existsSync(config.databaseFile);
};

const getDb = (): sqlite3.Database => {
  if (db === null) {
    const config = getConfig();
    console.log("Opening database:", config.databaseFile);
    db = new sqlite3.Database(config.databaseFile);
  }
  return db;
};

export const query = <T>(sql: string, args?: any[]): Promise<T[]> => {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(sql, args, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
};

const dbIsCurrentVersion = async (): Promise<boolean> => {
  const rows = await query<{ value: string }>(
    "SELECT value FROM key_value WHERE key = 'db_version'"
  );
  if (rows.length === 0) {
    return false;
  }
  const dbVersion = parseInt(rows[0].value, 10);
  console.log(dbVersion, DB_VERSION);
  return dbVersion === DB_VERSION;
};

export const healthCheckFatal = async (): Promise<void> => {
  if (!dbFileExists()) {
    console.error("Database file does not exist. Run `gym db init` to setup");
    process.exit(1);
  }
  if (!(await dbIsCurrentVersion())) {
    console.error("Database schema has changed. Run `gym db rebuild` to fix");
    process.exit(1);
  }
};

export const healthCheckPrompt = async (): Promise<void> => {
  if (!dbFileExists()) {
    const question =
      "Database file does not exist. Run `gym db init` to setup?";

    if (await yNPrompt(question)) console.log("TODO");
    else process.exit(1);
  }
  if (!(await dbIsCurrentVersion())) {
    const question =
      "Database schema has changed. Run `gym db rebuild` to fix?";

    if (await yNPrompt(question)) console.log("TODO");
    else process.exit(1);
  }
};
