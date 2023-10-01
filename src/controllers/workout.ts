import { Config } from "../lib/config";
import { Database } from "../lib/database";
import { parseWorkout } from "../lib/parser";
import { PersistWorkout } from "../lib/persistWorkout";
import { yNPrompt } from "../lib/prompt";
import { spawn } from "child_process";
import { formatDate } from "../lib/util";
import fs from "fs";
import path from "path";

export class WorkoutController {
  private config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  save = async (fileNames: string[]) => {
    await Database.open(this.config.databaseFile, async (db) => {
      const persist = new PersistWorkout(db);
      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        try {
          const ast = parseWorkout(fs.readFileSync(fileName, "utf-8"));
          await persist.saveWorkout(fileName, ast);
        } catch (e) {
          if (e instanceof Error)
            throw new Error(`Problem saving file ${fileName}: ${e.message}`);
          else throw e;
        }
      }
    });
  };

  // TODO: this should be able to read from stdin
  new = async (
    options: { template: string; date: string; name: string },
    stdin: string
  ) => {
    // Make sure the database is healthy
    await Database.open(this.config.databaseFile, () => Promise.resolve());
    const { template, date, name } = options;
    const workoutDate = date ?? dateToYMD(new Date());
    const fileName = this.fileNameFromDateAndTitle(workoutDate, name);

    let fileContents = template ? getFileFromTemplate(template) : stdin;

    fileContents = setFrontMatter(fileContents, date, name);
    return console.log(fileName, fileContents);
    fs.writeFileSync(this.workoutPath(fileName), fileContents);

    return await this.edit(fileName);
  };

  rm = async (fileNames: string[], options: { deleteFile: boolean }) => {
    await Database.open(this.config.databaseFile, async (db) => {
      for (let i = 0; i < fileNames.length; i++) {
        const filePath = fileNames[i];
        if (options.deleteFile && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await new PersistWorkout(db).deleteWorkout(filePath);
      }
    });
  };

  edit = async (fileName: string) => {
    // TODO: check unsynced files and prompt
    await Database.open(this.config.databaseFile, () => Promise.resolve());
    this.openInEditor(fileName);
  };

  // TODO: this should be able to read from stdin
  parse = (fileName: string) => {
    const ast = parseWorkout(fs.readFileSync(fileName, "utf-8"));
    console.log(JSON.stringify(ast, null, 2));
  };

  private openInEditor(fileName: string) {
    const editor = this.config.editor;
    const editorArgs = this.config.editorArgs;
    const args = [...editorArgs, fileName];

    spawn(editor, args, { stdio: "inherit" }).on("exit", (code) => {
      if (code === 0) {
        this.afterSaveFlow(fileName);
      } else {
        console.error(
          `Editor exited with error code ${code}. Changes have not been saved to the database`
        );
      }
    });
  }

  private workoutPath(fileName = "") {
    return path.join(process.cwd(), this.config.workoutDir, fileName);
  }

  private async afterSaveFlow(fileName: string) {
    // Check for errors
    // print new exercises to be created
    // print new PRs for existing exercises
    // ask to (e)dit, (d)elete, or (s)ave[, commit[, and push]] depending on config and presence of git
    const save = await yNPrompt("Save to database?");
    if (save) {
      await this.save([fileName]);
      console.log(`Saved ${fileName} to database.`);
    }
  }

  // Formats the filename and handles duplicates
  private fileNameFromDateAndTitle(date: string, title = "") {
    if (!date.match(/^(\d{4})-(\d{2})-(\d{2})$/))
      throw new Error("Expected date in YYYY-MM-DD format, but got " + date);

    let parts = [date];
    if (title) {
      // TODO: Should probably truncate this if it gets too long
      let normalizedTitle = title
        .replace(/[\W_]/g, " ")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      parts.push(normalizedTitle);
    }

    let fileName = parts.join("-") + ".gym";

    let dedupNum = 1;
    while (fs.existsSync(this.workoutPath(fileName))) {
      fileName = [...parts, dedupNum++].join("-") + ".gym";
    }

    return fileName;
  }
}

const leftPad02 = (str: string): string =>
  str.length >= 2 ? str : leftPad02(0 + str);

const dateToYMD = (date: Date) => {
  return `${date.getFullYear()}-${leftPad02(
    (date.getMonth() + 1).toString()
  )}-${date.getDate()}`;
};

const getFileFromTemplate = (templatePath: string): string => {
  return fs.readFileSync(templatePath, "utf-8");
};

const setFrontMatter = (fileContents: string, date: string, title?: string) => {
  const titleLine = title ? `title: ${title}\n` : "";
  const dateLine = `date: ${formatDate(date)}\n`;
  let result = fileContents;

  // Delete the lines if they already exist, so we can re-add them without dups
  result = fileContents.replace(/^\s*date\s*:.*$/gm, "");
  if (title) {
    result = fileContents.replace(/^\s*title\s*:.*$/gm, "");
  }

  return insertIntoFrontMatter(result, titleLine + dateLine);
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
      fileContents.slice(match.value.index + 1)
    );
  }

  return "---\n" + lines + "---\n\n";
};
