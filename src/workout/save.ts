import { parseWorkout } from "../parser";
import { Exercise } from "../parser/exercise";
import { Set } from "../parser/set";
import { query } from "../db";

export const saveWorkout = async (
  fileName: string,
  workout: string
): Promise<number> => {
  const document = parseWorkout(workout);
  const args = [
    fileName,
    JSON.stringify(document.frontMatter), // frontMatter
    new Date().toISOString(), // createdAt
    new Date().toISOString(), // updatedAt
  ];
  // TODO: delete workout if it already exists
  // TODO: handle errors

  // saves the workout to the database, returning the id
  // of the workout
  const rows = await query<{ id: number }>(
    `
      INSERT INTO workout (file_name, front_matter, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      RETURNING id;
    `,
    args
  );

  const workoutId = rows[0].id;
  await saveExercises(workoutId, document.exercises);
  return workoutId;
};

type ExerciseWithId = Exercise & { id: number };

const saveExercises = async (
  workoutId: number,
  exercises: Exercise[]
): Promise<number[]> => {
  const exerciseNames = exercises.map((exercise) => exercise.name);
  const existingExerciseRows = await query<{ id: number; name: string }>(
    `SELECT id, name FROM exercise WHERE name IN (${exerciseNames
      .map(() => "?")
      .join(", ")}) COLLATE NOCASE;`,
    exerciseNames
  );

  const newExerciseNames = exerciseNames.filter((exerciseName) => {
    return !existingExerciseRows.some((row) => row.name === exerciseName);
  });
  const newExerciseRows = await query<{ id: number; name: string }>(
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

  const rows = await query<{ id: number }>(
    `INSERT INTO exercise_instance (exercise_id, sequence, subsequence, line_start, line_end, workout_id)
    VALUES ${exercisesWithIds
      .map(() => "(?, ?, ?, ?, ?, ?)")
      .join(", ")} RETURNING id;`,
    exerciseArgs.flat()
  );

  exercisesWithIds.forEach((exercise, i) => {
    saveSets(rows[i].id, exercise.sets);
  });

  return rows.map((row) => row.id);
};

type FlatSet = Omit<Set, "reps"> & { reps?: number };

const flattenSets = (sets: Set[]): FlatSet[] =>
  sets.flatMap((set) => {
    if (typeof set.reps === "undefined") return [set as FlatSet];
    return set.reps.map((rep) => ({ ...set, reps: rep }));
  });

const saveSets = async (
  exerciseInstanceId: number,
  sets: Set[]
): Promise<number[]> => {
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

  const rows = await query<{ id: number }>(
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
};
