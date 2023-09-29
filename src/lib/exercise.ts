import { Config } from "./config";
import { Database } from "./database";
import { formatDate } from "./util";

const MAX_REPS_FOR_PRS = 12;

type ExerciseRow = { id: number; name: string };
type RepMax = {
  reps: number;
  actualReps: number;
  date: string;
  weight: number;
  workoutId: number;
  weightUnit: string;
};

export class Exercise {
  private db: Database;
  private config: Config;

  constructor(config: Config, db: Database) {
    this.db = db;
    this.config = config;
  }

  async getExerciseByName(name: string): Promise<ExerciseRow | null> {
    const results = await this.db.query<ExerciseRow>(
      "select * from exercise where name = ? COLLATE NOCASE;",
      [name]
    );

    if (results.length === 0) return null;

    return results[0];
  }

  async getRepMaxPrs(exId: number): Promise<RepMax[]> {
    const defaultWeightUnit = this.config.unitSystem === "metric" ? "kg" : "lb";
    let results: RepMax[] = [];

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
          w.id as workoutId
        from "set" s 
          inner join exercise_instance ei on ei.id = s.exercise_instance_id
          inner join exercise e on e.id = ei.exercise_id
          inner join workout w on w.id = ei.workout_id
        where e.id = ? and s.reps >= ${i} and weight is not null
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

  async printRepMaxPrs(exId: number) {
    const prs = await this.getRepMaxPrs(exId);
    const defaultWeightUnit = this.config.unitSystem === "metric" ? "kg" : "lb";
    prs.forEach((pr) => {
      const rm = `${pr.reps}RM: ${pr.weight}${
        pr.weightUnit ?? defaultWeightUnit
      }`;
      const instance =
        pr.reps === pr.actualReps ? "" : `${pr.weight}x${pr.reps} on `;

      console.log(
        `${rm} (${instance}${formatDate(pr.date, this.config.locale)})`
      );
    });
  }
}
