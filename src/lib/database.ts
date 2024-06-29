import sqlite3 from "sqlite3";
import fs from "fs";

const DB_VERSION = 1;

export class Database {
  private db: sqlite3.Database;

  private constructor(db: sqlite3.Database) {
    this.db = db;
  }

  private static connections: Record<string, sqlite3.Database> = {};

  static async open<T>(
    databaseFile: string,
    fn: (db: Database) => Promise<T>
  ): Promise<T> {
    if (Database.connections[databaseFile]) {
      return fn(new Database(Database.connections[databaseFile]));
    }

    const isMemory = databaseFile === ":memory:";
    if (!isMemory && !fileExists(databaseFile)) {
      dbNotExistsError(databaseFile);
    }

    const sqliteDb = await openDatabase(databaseFile);
    const instance = new Database(sqliteDb);

    if (!isMemory && !(await instance.dbIsCurrentVersion())) {
      wrongVersionError();
    }

    try {
      Database.connections[databaseFile] = sqliteDb;
      return await fn(instance);
    } finally {
      await closeDatabase(sqliteDb);
      delete Database.connections[databaseFile];
    }
  }

  static async initializeDatabase(
    databaseFile: string,
    beforeClose?: (db: Database) => Promise<void>
  ): Promise<void> {
    const db = await openDatabase(databaseFile);
    // This will make sure we can nest database.open during testing
    Database.connections[databaseFile] = db;
    await new Promise<void>((resolve) => {
      // Create tables
      db.serialize(() => {
        // workout table - id autoincrements
        db.run(`
            CREATE TABLE workout (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              file_name TEXT NOT NULL,
              front_matter JSON,
              workout_date DATETIME NOT NULL,
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
              subsequence INTEGER NOT NULL,
              line_start INTEGER NOT NULL,
              line_end INTEGER NOT NULL,
              workout_id INTEGER,
              FOREIGN KEY(exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
              FOREIGN KEY(workout_id) REFERENCES workout(id) ON DELETE CASCADE
            );
          `);

        // set table
        db.run(`
            CREATE TABLE "set" (
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

    if (beforeClose) await beforeClose(new Database(db));
    delete Database.connections[databaseFile];
    return await closeDatabase(db);
  }

  query<T>(sql: string, args?: any[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, args, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  static singleQuery<T>(file: string, sql: string, args?: any[]): Promise<T[]> {
    return Database.open(file, (db) => db.query(sql, args));
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
}

function openDatabase(databaseFile: string): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databaseFile, (err) => {
      if (err) return reject(`Error opening database: ${err.message}`);
      resolve(db);
    });
  });
}

function closeDatabase(db: sqlite3.Database): Promise<void> {
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

function fileExists(file: string): boolean {
  return fs.existsSync(file);
}

const wrongVersionError = () => {
  throw new Error(
    `Database schema has changed. Run \`gym db rebuild\` to rebuild it`
  );
};

const dbNotExistsError = (file: string) => {
  throw new Error(
    `Database file ${file} does not exist. Run \`gym db init\` to create it`
  );
};
