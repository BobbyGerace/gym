import { Config } from "../lib/config";
import { Database } from "../lib/database";
import { ParseError, parse, parseOrThrow } from "../lib/parser";
import { PersistWorkout } from "../lib/persistWorkout";
import { formatDate } from "../lib/util";
import fs from "fs";
import path from "path";
import { DbController } from "./db";
import { changedFilesPrompt } from "../lib/findChangedFiles";
import { formatErrorMessage } from "../lib/formatErrorMessage";
import { logger } from "../lib/logger";
import { toJson } from "../lib/toJson";
import { EditFile } from "../lib/EditFile";

export class WorkoutController {
  private config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  history = async (options: {
    number?: string;
    name?: string;
    locationsOnly?: boolean;
    json?: boolean;
    prettyPrint?: boolean;
    fullPath?: boolean;
  }) => {
    await Database.open(this.config.databaseFile, async (db) => {
      const persist = new PersistWorkout(db, this.config);
      const number = options.number ? parseInt(options.number) : undefined;
      if (number && isNaN(number)) {
        throw new Error("Number is invalid");
      }

      const workouts = await persist.listWorkouts(number ?? null, options.name);
      const workoutsWithFullPath = workouts.map((workout) => {
        const pathArgs = options.fullPath ? [process.cwd()] : [];

        return {
          ...workout,
          fileName: path.join(
            ...pathArgs,
            this.config.workoutDir,
            workout.fileName
          ),
        };
      });

      if (options.json) {
        logger.log(toJson(workoutsWithFullPath, options.prettyPrint));
      } else if (options.locationsOnly) {
        logger.log(workoutsWithFullPath.map((w) => w.fileName).join("\n"));
      } else {
        logger.log(
          workoutsWithFullPath
            .map((w) => `${w.fileName}\n${formatFrontMatter(w.frontMatter)}\n`)
            .join("\n")
        );
      }
    });
  };

  save = async (fileNames: string[]) => {
    await Database.open(this.config.databaseFile, async (db) => {
      const persist = new PersistWorkout(db, this.config);
      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        try {
          const ast = parseOrThrow(fs.readFileSync(fileName, "utf-8"));
          await persist.saveWorkout(fileName, ast);
        } catch (e) {
          if (e instanceof Error)
            throw new Error(`Problem saving file ${fileName}: ${e.message}`);
          else throw e;
        }
      }
    });
  };

  new = async (
    options: { template?: string; date?: string; name?: string },
    stdin: string
  ) => {
    // Make sure the database is healthy
    await Database.open(this.config.databaseFile, async (db) => {
      if (await changedFilesPrompt(this.config, db)) {
        await new DbController(this.config).sync({ yes: true });
      }
      const { template, date, name } = options;
      const workoutDate = date ?? dateToYMD(new Date());
      const fileName = this.fileNameFromDateAndName(workoutDate, name);

      let fileContents = template ? getFileFromTemplate(template) : stdin;

      fileContents = this.setFrontMatter(fileContents, workoutDate, name);

      const filePath = this.workoutPath(fileName);
      if (!fs.existsSync(this.config.workoutDir)) {
        fs.mkdirSync(this.config.workoutDir, { recursive: true });
      }
      fs.writeFileSync(filePath, fileContents);

      await new EditFile(filePath, db, this.config, true).begin();
    });
  };

  rm = async (fileNames: string[], options: { deleteFile: boolean }) => {
    await Database.open(this.config.databaseFile, async (db) => {
      for (let i = 0; i < fileNames.length; i++) {
        const filePath = fileNames[i];
        if (options.deleteFile && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        const fileName = path.basename(filePath);
        await new PersistWorkout(db, this.config).deleteWorkout(fileName);
      }
    });
  };

  edit = async (filePath: string) => {
    await Database.open(this.config.databaseFile, async (db) => {
      if (await changedFilesPrompt(this.config, db)) {
        await new DbController(this.config).sync({ yes: true });
      }
      await new EditFile(filePath, db, this.config, false).begin();
    });
  };

  parse = (
    options: { strict?: boolean; prettyPrint?: boolean },
    fileName?: string,
    stdin?: string
  ) => {
    const fileContents =
      (fileName ? fs.readFileSync(fileName, "utf-8") : stdin) ?? "";

    const result = parse(fileContents);
    const { errors } = result;

    if (errors.length > 0 && options.strict) {
      this.printErrors(errors, fileContents);
      process.exit(1);
    } else if (errors.length > 0) {
      logger.log(toJson(result, options.prettyPrint));
      process.exit(1);
    } else {
      logger.log(toJson(result, options.prettyPrint));
    }
  };

  private workoutPath(fileName = "") {
    return path.join(process.cwd(), this.config.workoutDir, fileName);
  }

  private printErrors(errors: ParseError[], fileContents: string) {
    logger.error(
      errors.map((e) => formatErrorMessage(e, fileContents)).join("\n")
    );
  }

  // Formats the filename and handles duplicates
  private fileNameFromDateAndName(date: string, name = "") {
    if (!date.match(/^(\d{4})-(\d{2})-(\d{2})$/))
      throw new Error("Expected date in YYYY-MM-DD format, but got " + date);

    let parts = [date];
    if (name) {
      let normalizedName = name
        .replace(/[\W_]/g, " ")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase()
        .substring(0, 241); // To keep the file name < 255 char
      parts.push(normalizedName);
    }

    let fileName = parts.join("-") + ".gym";

    let dedupNum = 1;
    while (fs.existsSync(this.workoutPath(fileName))) {
      fileName = [...parts, dedupNum++].join("-") + ".gym";
    }

    return fileName;
  }

  private setFrontMatter(fileContents: string, date: string, name?: string) {
    const nameLine = name ? `name: ${name}\n` : "";
    const dateLine = `date: ${formatDate(date, this.config.locale)}\n`;
    let result = fileContents;

    // Delete the lines if they already exist, so we can re-add them without dups
    result = fileContents.replace(/^\s*date\s*:.*$/gm, "");
    if (name) {
      result = fileContents.replace(/^\s*name\s*:.*$/gm, "");
    }

    return insertIntoFrontMatter(result, nameLine + dateLine);
  }
}

const leftPad02 = (str: string): string =>
  str.length >= 2 ? str : leftPad02(0 + str);

const dateToYMD = (date: Date) => {
  return `${date.getFullYear()}-${leftPad02(
    (date.getMonth() + 1).toString()
  )}-${leftPad02(date.getDate().toString())}`;
};

const getFileFromTemplate = (templatePath: string): string => {
  return fs.readFileSync(templatePath, "utf-8");
};

// Assumes the lines end with \n
const insertIntoFrontMatter = (fileContents: string, lines: string) => {
  const delimiterMatcher = fileContents.matchAll(/^\s*---/gm);
  delimiterMatcher.next();
  const match = delimiterMatcher.next();
  if (match.value) {
    return (
      fileContents.slice(0, match.value.index) +
      lines +
      fileContents.slice(match.value.index)
    );
  }

  return "---\n" + lines + "---\n\n" + fileContents;
};

const formatFrontMatter = (
  frontMatter: Record<string, boolean | number | string>
) => {
  const lines = Object.entries(frontMatter).map(
    ([key, value]) => `${key}: ${value}`
  );
  return `---\n${lines.join("\n")}\n---`;
};
