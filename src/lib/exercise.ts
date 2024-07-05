import { Config } from "./config";
import { Database } from "./database";

const MAX_REPS_FOR_PRS = 12;

type ExerciseRow = { id: number; name: string };
type RepMax = {
  reps: number;
  actualReps: number;
  date: string;
  weight: number;
  weightUnit: string;
  workoutId: number;
  fileName: number;
};

export class Exercise {
  private db: Database;
  private config: Config;

  constructor(config: Config, db: Database) {
    this.db = db;
    this.config = config;
  }

  async rename(id: number, newName: string) {
    await this.db.query("update exercise set name = ? where id = ?;", [
      newName,
      id,
    ]);
  }

  async merge(fromId: number, intoId: number) {
    await this.db.query(
      "update exercise_instance set exercise_id = ? where exercise_id = ?;",
      [intoId, fromId]
    );

    await this.db.query("delete from exercise where id = ?;", [fromId]);
  }

  async getExerciseByName(name: string): Promise<ExerciseRow | null> {
    const results = await this.db.query<ExerciseRow>(
      "select * from exercise where name = ? COLLATE NOCASE;",
      [name]
    );

    if (results.length === 0) return null;

    return results[0];
  }

  async getRepMaxPrs(exId: number, exact = false): Promise<RepMax[]> {
    const defaultWeightUnit = this.config.unitSystem === "metric" ? "kg" : "lb";
    let results: RepMax[] = [];

    const comparator = exact ? "=" : ">=";

    // This feels kinda horrible, but it works. We can always refactor if
    // performance becomes an issue
    for (let i = 1; i <= MAX_REPS_FOR_PRS; i++) {
      results = results.concat(
        await this.db.query<RepMax>(
          `
        select 
          ${i} as reps,
          s.reps as actualReps,
          w.workout_date as "date",
          s.weight_value as weight,
          s.weight_unit as weightUnit,
          w.id as workoutId,
          w.file_name as fileName
        from "set" s 
          inner join exercise_instance ei on ei.id = s.exercise_instance_id
          inner join exercise e on e.id = ei.exercise_id
          inner join workout w on w.id = ei.workout_id
        where e.id = ? and s.reps ${comparator} ${i} and weight is not null
        order by s.weight_value * case 
          when coalesce(weight_unit, '${defaultWeightUnit}') = 'lb'
          then 0.453592
          else 1
        end desc, s.reps asc, w.workout_date desc
        limit 1
      `,
          [exId]
        )
      );
    }

    return results;
  }

  async getHistory(exId: number, num = 10) {
    return await this.db.query<{
      lineStart: number;
      lineEnd: number;
      fileName: string;
      date: string;
    }>(
      `
      select 
        ei.line_start as lineStart,
        ei.line_end as lineEnd,
        w.file_name as fileName,
        w.workout_date as "date"
      from exercise_instance ei
        inner join workout w on w.id = ei.workout_id
      where ei.exercise_id = ?
      order by w.workout_date desc
      limit ?;
    `,
      [exId, num]
    );
  }

  async exerciseExists(name: string): Promise<boolean> {
    const results = await this.db.query<ExerciseRow>(
      "select * from exercise where name = ? COLLATE NOCASE;",
      [name]
    );

    return results.length > 0;
  }
}
