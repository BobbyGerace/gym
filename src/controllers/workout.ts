import { Config } from "../lib/config";
import { Database } from "../lib/database";
import { parseWorkout } from "../lib/parser";
import { PersistWorkout } from "../lib/persistWorkout";
import { yNPrompt } from "../lib/prompt";
import { spawn } from "child_process";
import fs from "fs";

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
  new = (options: { template: string; date: string }) => {
    // create name from date or current date
    // append something if the file already exists
    // read file if template, or read from stdin, or ottherwise create
    // find or create frontmatter and put the title / date in
    // write to the file name we came up with
    // open editor
    // print new exercises to be created
    // print new PRs for existing exercises
    // ask to (e)dit, (d)elete, or (s)ave[, commit[, and push]] depending on config and presence of git
    if (options.template) {
      console.log(`Creating new workout from template ${options.template}...`);
    } else {
      console.log("Creating new workout...");
    }
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

  private async afterSaveFlow(fileName: string) {
    const save = await yNPrompt("Save to database?");
    if (save) {
      await this.save([fileName]);
      console.log(`Saved ${fileName} to database.`);
    }
  }
}
