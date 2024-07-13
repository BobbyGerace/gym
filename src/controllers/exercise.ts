import { Config } from "../lib/config";
import { Database } from "../lib/database";
import { Exercise } from "../lib/exercise";
import { formatDate } from "../lib/util";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";
import { toJson } from "../lib/toJson";

export class ExerciseController {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  rename = async (
    oldName: string,
    newName: string,
    options: { merge?: boolean }
  ) => {
    await Database.open(this.config.databaseFile, async (db) => {
      // TODO: Should we check whether there are unsynced files?
      const exercise = new Exercise(this.config, db);

      const oldEx = await exercise.getExerciseByName(oldName);
      if (!oldEx) {
        throw new Error(`Exercise not found: ${oldName}`);
      }
      const history = await exercise.getHistory(oldEx.id, 1_000_000);

      const newEx = await exercise.getExerciseByName(newName);
      if (newEx !== null && !options.merge) {
        throw new Error(
          `Exercise already exists: ${newName}. Use --merge to merge histories.`
        );
      } else if (newEx !== null && options.merge) {
        await exercise.merge(oldEx.id, newEx.id);
      } else {
        await exercise.rename(oldEx.id, newName);
      }

      for (const h of history) {
        const filePath = path.join(
          process.cwd(),
          this.config.workoutDir,
          h.fileName
        );

        const file = fs.readFileSync(filePath, "utf-8");
        const newFile = replaceExerciseInFile(
          file,
          oldName,
          newEx?.name ?? newName
        );
        fs.writeFileSync(filePath, newFile);
      }
    });
  };

  list = async () => {
    await Database.open(this.config.databaseFile, async (db) => {
      const rows = await db.query<{ name: string }>(
        "select name from exercise order by id asc;"
      );
      logger.log(rows.map((r) => r.name).join("\n"));
    });
  };

  history = async (
    exName: string,
    options: { locationsOnly: boolean; number?: string }
  ) => {
    await Database.open(this.config.databaseFile, async (db) => {
      const exercise = new Exercise(this.config, db);
      const ex = await exercise.getExerciseByName(exName);
      if (!ex) {
        throw new Error(`Exercise not found: ${exName}`);
      }

      const history = await exercise.getHistory(
        ex.id,
        options.number ? parseInt(options.number) : null
      );

      if (options.locationsOnly) {
        history.forEach((h) =>
          logger.log(`${this.relativePath(h.fileName)}:${h.lineStart}`)
        );
      } else {
        if (history.length === 0) {
          logger.log(`No history found for ${exName}`);
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

          const dateHeader = `--- ${formatDate(
            h.date,
            this.config.locale
          )} ---`;
          const padding = sectionLines[sectionLines.length - 1]?.match(/^\s*$/)
            ? ""
            : "\n";

          logger.log(`${dateHeader}\n${sectionLines.join("\n")}${padding}`);
        }
      }
    });
  };

  // TODO: This only handles rep maxes. Eventually we should be able to handle
  // other exercise types (pace or distance PRs for endurance activies, etc)
  prs = async (
    exName: string,
    options: { json: boolean; prettyPrint: boolean; exact: boolean }
  ) => {
    await Database.open(this.config.databaseFile, async (db) => {
      const exercise = new Exercise(this.config, db);
      const ex = await exercise.getExerciseByName(exName);
      if (!ex) {
        throw new Error(`Exercise not found: ${exName}`);
      }

      const prs = await exercise.getRepMaxPrs(ex.id, options.exact);

      const defaultWeightUnit =
        this.config.unitSystem === "metric" ? "kg" : "lb";

      if (options.json) {
        logger.log(toJson(prs, options.prettyPrint));
        return;
      }

      prs.forEach((pr) => {
        const unit = pr.weightUnit ?? defaultWeightUnit;
        const rm = `${pr.reps}RM: ${
          unit === "bw" ? "Bodyweight" : pr.weight + unit
        }`;
        const instance =
          pr.reps === pr.actualReps
            ? ""
            : `${unit === "bw" ? "BW" : pr.weight}x${pr.actualReps} on `;

        logger.log(
          `${rm} (${instance}${formatDate(pr.date, this.config.locale)})`
        );
      });
    });
  };

  private relativePath(fileName = "") {
    return path.join(this.config.workoutDir, fileName);
  }
}

// This seems horrible, but it's officially recommended by MDN so...
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function escapeReplacement(str: string) {
  return str.replace(/\$/g, "$$$$");
}

const replaceExerciseInFile = (
  fileContents: string,
  oldName: string,
  newName: string
) => {
  const regex = new RegExp(`^(\\s*[#&]\\s*)(${escapeRegExp(oldName)})`, "gim");
  return fileContents.replace(regex, `$1${escapeReplacement(newName)}`);
};
