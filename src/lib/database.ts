import sqlite3 from "sqlite3";
import { yNPrompt } from "./prompt";
import fs from "fs";

const DB_VERSION = 1;

export class Database {
  private _db: null | sqlite3.Database;
  private databaseFile: string;

  constructor(databaseFile: string) {
    console.log(databaseFile);
    this.databaseFile = databaseFile;
    this._db = null;
  }

  openDatabase(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.databaseFile, (err) => {
        if (err) return reject(`Error opening database: ${err.message}`);
        resolve(db);
      });
    });
  }

  closeDatabase(db: sqlite3.Database): Promise<void> {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(new Error(`Error closing database: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async connect<T>(fn: (db: sqlite3.Database) => Promise<T>): Promise<T> {
    if (this._db) {
      console.log("here");
      return fn(this._db);
    } else {
      const db = await this.openDatabase();

      try {
        const result = await fn(db);
        console.log("ayy");
        await this.closeDatabase(db);
        return result;
      } catch (e) {
        await this.closeDatabase(db);
        console.log("lmao");
        throw e;
      }
    }
  }

  async withSingleConnection(fn: () => Promise<void>) {
    await this.connect(async (db) => {
      try {
        this._db = db;
        await fn();
      } finally {
        this._db = null;
      }
    });
  }

  initializeDatabase(): Promise<void> {
    return this.connect<void>((db) => {
      return new Promise((resolve) => {
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
              FOREIGN KEY(exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
              FOREIGN KEY(workout_id) REFERENCES workout(id) ON DELETE CASCADE
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
              FOREIGN KEY(exercise_instance_id) REFERENCES exercise_instance(id) ON DELETE CASCADE
            );
          `);

          db.run(`
            CREATE TABLE key_value (
              key TEXT PRIMARY KEY,
              value JSON
            );
          `);

          // Careful: The last one should always contain the resolve
          db.run(
            `
            INSERT INTO key_value (key, value)
            VALUES ('db_version', ${DB_VERSION});
          `,
            () => {
              resolve();
            }
          );
        });
      });
    });
  }

  dbFileExists(): boolean {
    return fs.existsSync(this.databaseFile);
  }

  query<T>(sql: string, args?: any[]): Promise<T[]> {
    return this.connect((db) => {
      return new Promise((resolve, reject) => {
        db.all(sql, args, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as T[]);
          }
        });
      });
    });
  }
  async dbIsCurrentVersion(): Promise<boolean> {
    const rows = await this.query<{ value: string }>(
      "SELECT value FROM key_value WHERE key = 'db_version'"
    );
    if (rows.length === 0) {
      return false;
    }
    const dbVersion = parseInt(rows[0].value, 10);
    return dbVersion === DB_VERSION;
  }

  async healthCheckFatal(): Promise<void> {
    if (!this.dbFileExists()) {
      console.error("Database file does not exist. Run `gym db init` to setup");
      process.exit(1);
    }
    if (!(await this.dbIsCurrentVersion())) {
      console.error("Database schema has changed. Run `gym db rebuild` to fix");
      process.exit(1);
    }
  }

  async healthCheckPrompt(): Promise<void> {
    if (!this.dbFileExists()) {
      const question =
        "Database file does not exist. Run `gym db init` to setup?";

      if (await yNPrompt(question)) console.log("TODO");
      else process.exit(1);
    }
    if (!(await this.dbIsCurrentVersion())) {
      const question =
        "Database schema has changed. Run `gym db rebuild` to fix?";

      if (await yNPrompt(question)) console.log("TODO");
      else process.exit(1);
    }
  }
}
