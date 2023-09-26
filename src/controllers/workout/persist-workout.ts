import { Database } from "../../lib/database";
import { parseWorkout } from "../../lib/parser";
import { Workout, Exercise, Set } from "../../lib/parser/ast";
import fs from "fs";

type ExerciseWithId = Exercise & { id: number };
type FlatSet = Omit<Set, "reps"> & { reps?: number };

export class PersistWorkout {
  private db: Database;
  constructor(db: Database) {
    this.db = db;
  }

  async saveWorkout(fileName: string, ast: Workout): Promise<number> {
    await this.deleteWorkout(fileName);

    const args = [
      fileName,
      JSON.stringify(ast.frontMatter), // frontMatter
      new Date().toISOString(), // createdAt
      new Date().toISOString(), // updatedAt
    ];

    // saves the workout to the database, returning the id
    // of the workout
    const rows = await this.db.query<{ id: number }>(
      `
      INSERT INTO workout (file_name, front_matter, created_at, updated_at)
      VALUES (?, ?, ?, ?)
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
    const newExerciseRows = await this.db.query<{ id: number; name: string }>(
      `INSERT INTO exercise (name) VALUES ${newExerciseNames
        .map(() => "(?)")
        .join(", ")};`,
      newExerciseNames
    );

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
      let weightValue: number | null = null;
      if (set.weight === "bw") weightValue = 0;
      else if (typeof set.weight === "number") weightValue = set.weight;
      else if (typeof set.weight === "object") weightValue = set.weight.value;

      let weightUnit: string | null = null;
      if (set.weight === "bw") weightUnit = "bw";
      else if (typeof set.weight === "number") weightUnit = "lb";
      else if (typeof set.weight === "object") weightUnit = set.weight.unit;

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
      `INSERT INTO exercise_set (
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

  fileExists(fileName: string): boolean {
    return fs.existsSync(fileName);
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
  sets.flatMap((set) => {
    if (typeof set.reps === "undefined") return [set as FlatSet];
    return set.reps.map((rep) => ({ ...set, reps: rep }));
  });
