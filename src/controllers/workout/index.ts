import { Config } from "../../lib/config";
import { Database } from "../../lib/database";
import { parseWorkout } from "../../lib/parser";
import { PersistWorkout } from "./persistWorkout";
import { yNPrompt } from "../../lib/prompt";
import { spawn } from "child_process";

import fs from "fs";

export class WorkoutController {
  private config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  async save(fileName: string) {
    Database.open(this.config.databaseFile, async (db) => {
      console.log(`Saving workout from ${fileName} to database...`);
      const ast = parseWorkout(fs.readFileSync(fileName, "utf-8"));
      await new PersistWorkout(db).saveWorkout(fileName, ast);
    });
  }

  async new(options: { template: string; date: string }) {
    if (options.template) {
      console.log(`Creating new workout from template ${options.template}...`);
    } else {
      console.log("Creating new workout...");
    }
  }

  async rm(fileName: string) {
    Database.open(this.config.databaseFile, async (db) => {
      console.log(`Deleting workout ${fileName}...`);
      await new PersistWorkout(db).deleteWorkout(fileName);
    });
  }

  async edit(fileName: string) {
    Database.open(this.config.databaseFile, () => Promise.resolve());
    this.openInEditor(fileName);
  }

  async parse(fileName: string) {
    const ast = parseWorkout(fs.readFileSync(fileName, "utf-8"));
    console.log(JSON.stringify(ast, null, 2));
  }

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
      await this.save(fileName);
      console.log(`Saved ${fileName} to database.`);
    }
  }
}
