import { Config } from "../lib/config";
import { Database } from "../lib/database";
import { Exercise } from "../lib/exercise";
import { formatDate } from "../lib/util";
import fs from "fs";
import path from "path";

export class ExerciseController {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  // TODO: Add a rename method

  list = () => {
    Database.open(this.config.databaseFile, async (db) => {
      const rows = await db.query<{ name: string }>(
        "select name from exercise order by id asc;"
      );
      console.log(rows.map((r) => r.name).join("\n"));
    });
  };

  history = async (
    exName: string,
    options: { locationsOnly: boolean; number: number }
  ) => {
    await Database.open(this.config.databaseFile, async (db) => {
      const exercise = new Exercise(this.config, db);
      const ex = await exercise.getExerciseByName(exName);
      if (!ex) {
        console.error(`Exercise not found: ${exName}`);
        return process.exit(1);
      }

      const history = await exercise.getHistory(ex.id, options.number);

      if (options.locationsOnly) {
        history.forEach((h) => console.log(`${h.lineStart}:${h.fileName}`));
      } else {
        if (history.length === 0) {
          console.log(`No history found for ${exName}`);
          return;
        }
        for (const h of history) {
          const filePath = path.join(
            process.cwd(),
            this.config.workoutDir,
            h.fileName
          );

          const file = fs.readFileSync(filePath);
          const sectionLines = file
            .toString()
            .split("\n")
            .slice(h.lineStart - 1, h.lineEnd);

          const dateHeader = `--- ${formatDate(h.date)} ---`;
          const padding = sectionLines[sectionLines.length - 1]?.match(/^\s*$/)
            ? ""
            : "\n";

          console.log(`${dateHeader}\n${sectionLines.join("\n")}${padding}`);
        }
      }
    });
  };

  // TODO: This only handles rep maxes. Eventually we should be able to handle
  // other exercise types (pace or distance PRs for endurance activies, etc)
  prs = async (exName: string) => {
    await Database.open(this.config.databaseFile, async (db) => {
      const exercise = new Exercise(this.config, db);
      const ex = await exercise.getExerciseByName(exName);
      if (!ex) {
        console.error(`Exercise not found: ${exName}`);
        return process.exit(1);
      }

      const prs = await exercise.getRepMaxPrs(ex.id);
      const defaultWeightUnit =
        this.config.unitSystem === "metric" ? "kg" : "lb";
      prs.forEach((pr) => {
        const unit = pr.weightUnit ?? defaultWeightUnit;
        const rm = `${pr.reps}RM: ${
          unit === "bw" ? "Bodyweight" : pr.weight + unit
        }`;
        const instance =
          pr.reps === pr.actualReps
            ? ""
            : `${unit === "bw" ? "BW" : pr.weight}x${pr.actualReps} on `;

        console.log(
          `${rm} (${instance}${formatDate(pr.date, this.config.locale)})`
        );
      });
    });
  };
}
