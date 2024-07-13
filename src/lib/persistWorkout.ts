import { Config } from "./config";
import { Database } from "./database";
import { Workout, Exercise, Set } from "./parser/ast";
import path from "path";

type ExerciseWithId = Exercise & { id: number };
type FlatSet = Omit<Set, "reps" | "sets"> & { reps?: number };
type WorkoutHistoryItem = {
  fileName: string;
  date: string;
  frontMatter: Record<string, string | boolean | number>;
};

export class PersistWorkout {
  private db: Database;
  private config: Config;
  constructor(db: Database, config: Config) {
    this.config = config;
    this.db = db;
  }

  dateFromFileName(fileName: string): string | null {
    const matches = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!matches) return null;
    else return matches[0];
  }

  async saveWorkout(filePath: string, ast: Workout): Promise<number> {
    const fileName = path.parse(filePath).base;
    await this.deleteWorkout(fileName);

    const args = [
      fileName,
      JSON.stringify(ast.frontMatter), // frontMatter
      this.dateFromFileName(fileName),
      new Date().toISOString(), // createdAt
      new Date().toISOString(), // updatedAt
    ];

    // saves the workout to the database, returning the id
    // of the workout
    const rows = await this.db.query<{ id: number }>(
      `
      INSERT INTO workout (file_name, front_matter, workout_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id;
    `,
      args
    );

    const workoutId = rows[0].id;
    await this.saveExercises(workoutId, ast.exercises);
    return workoutId;
  }

  async saveExercises(
    workoutId: number,
    exercises: Exercise[]
  ): Promise<number[]> {
    const exerciseNames = exercises.map((exercise) => exercise.name);
    const existingExerciseRows = await this.db.query<{
      id: number;
      name: string;
    }>(
      `SELECT id, name FROM exercise WHERE name COLLATE NOCASE IN (${exerciseNames
        .map(() => "?")
        .join(", ")});`,
      exerciseNames
    );

    const newExerciseNames = exerciseNames.filter((exerciseName) => {
      return !existingExerciseRows.some(
        (row) => row.name.toLowerCase() === exerciseName.toLowerCase()
      );
    });
    let newExerciseRows: { id: number; name: string }[] = [];
    if (newExerciseNames.length > 0) {
      newExerciseRows = await this.db.query<{ id: number; name: string }>(
        `INSERT INTO exercise (name) VALUES ${newExerciseNames
          .map(() => "(?)")
          .join(", ")} returning id, name;`,
        newExerciseNames
      );
    }

    const exIdMap = new Map<string, number>();
    existingExerciseRows.forEach((row) => {
      exIdMap.set(row.name.toLowerCase(), row.id);
    });
    newExerciseRows.forEach((row) => {
      exIdMap.set(row.name.toLowerCase(), row.id);
    });

    const exercisesWithIds: ExerciseWithId[] = exercises.map((exercise) => ({
      ...exercise,
      id: exIdMap.get(exercise.name.toLowerCase()) as number,
    }));

    const exerciseArgs = exercisesWithIds.map((exercise) => [
      exercise.id,
      exercise.sequence,
      exercise.subsequence,
      exercise.lineStart,
      exercise.lineEnd,
      workoutId,
    ]);

    const rows = await this.db.query<{ id: number }>(
      `INSERT INTO exercise_instance (exercise_id, sequence, subsequence, line_start, line_end, workout_id)
    VALUES ${exercisesWithIds
      .map(() => "(?, ?, ?, ?, ?, ?)")
      .join(", ")} RETURNING id;`,
      exerciseArgs.flat()
    );

    exercisesWithIds.forEach((exercise, i) => {
      this.saveSets(rows[i].id, exercise.sets);
    });

    return rows.map((row) => row.id);
  }

  async saveSets(exerciseInstanceId: number, sets: Set[]): Promise<number[]> {
    const flatSets = flattenSets(sets);

    const setArgs = flatSets.flatMap((set) => {
      const defaultWeightUnit =
        this.config.unitSystem === "imperial" ? "lb" : "kg";
      let weightValue: number | null = null;
      if (set.weight === "bw") weightValue = 0;
      else if (typeof set.weight === "number") weightValue = set.weight;
      else if (typeof set.weight === "object") weightValue = set.weight.value;

      let weightUnit: string | null = null;
      if (set.weight === "bw") weightUnit = "bw";
      else if (typeof set.weight === "number") weightUnit = null;
      else if (typeof set.weight === "object")
        weightUnit = set.weight.unit ?? defaultWeightUnit;

      return [
        weightValue, // weight_value REAL,
        weightUnit, // weight_unit TEXT,
        set.reps, // reps INTEGER,
        set.rpe, // rpe REAL,
        set.distance?.value, // distance_value REAL,
        set.distance?.unit, // distance_unit TEXT,
        set.time?.hours, // hours INTEGER
        set.time?.minutes, // minutes INTEGER
        set.time?.seconds, // seconds INTEGER
        set.tags ? JSON.stringify(set.tags) : null, // tags JSON,
        exerciseInstanceId, // exercise_instance_id INTEGER,
      ];
    });

    const rows = await this.db.query<{ id: number }>(
      `INSERT INTO \"set\" (
      weight_value,
      weight_unit,
      reps,
      rpe,
      distance_value,
      distance_unit,
      hours,
      minutes,
      seconds,
      tags,
      exercise_instance_id
    ) VALUES ${flatSets
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ")} RETURNING id;`,
      setArgs
    );
    return rows.map((row) => row.id);
  }

  async listWorkouts(
    num: number | null,
    name?: string
  ): Promise<WorkoutHistoryItem[]> {
    const limit = num ? `LIMIT ${num}` : "";
    // get only rows where front_matter.name = name
    const whereClause = name ? `WHERE front_matter->>'name' = ?` : "";
    const result = await this.db.query<
      WorkoutHistoryItem & { frontMatter: string }
    >(
      `SELECT
         file_name as fileName,
         workout_date as date,
         front_matter as frontMatter
       FROM workout 
       ${whereClause}
       ORDER BY workout_date DESC ${limit};`,
      name ? [name] : []
    );

    return result.map((row) => {
      return {
        fileName: row.fileName,
        date: row.date,
        frontMatter: JSON.parse(row.frontMatter ?? "{}"),
      };
    });
  }

  async deleteWorkout(fileName: string): Promise<void> {
    await this.db.query(`PRAGMA foreign_keys = ON;`);
    await this.db.query(`DELETE FROM workout WHERE file_name = ?;`, [fileName]);
    await this.cleanUpExercises();
  }

  async cleanUpExercises(): Promise<void> {
    await this.db.query(`DELETE FROM exercise WHERE id NOT IN (
      SELECT DISTINCT exercise_id FROM exercise_instance
    );`);
  }
}

const flattenSets = (sets: Set[]): FlatSet[] =>
  sets
    .flatMap(({ sets, ...rest }): Set[] => {
      if (!sets) return [rest];

      return Array.from({ length: sets }).fill(rest) as Set[];
    })
    .flatMap((set) => {
      if (typeof set.reps === "undefined") return [set as FlatSet];
      return set.reps.map((rep) => ({ ...set, reps: rep }));
    });
