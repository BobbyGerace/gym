import { Config } from "../../config";
import { Database } from "../../database";
import { parseWorkout } from "../../parser";
import { PersistWorkout } from "./persist-workout";
import { yNPrompt } from "../../prompt";
import { spawn } from "child_process";

import fs from "fs";

export class WorkoutController {
  private config: Config;
  private db: Database;
  private persistWorkout: PersistWorkout;
  constructor(config: Config, db: Database) {
    this.config = config;
    this.db = db;
    this.persistWorkout = new PersistWorkout(db);
  }

  async save(fileName: string) {
    await this.db.healthCheckFatal();

    console.log(`Saving workout from ${fileName} to database...`);
    const ast = parseWorkout(fs.readFileSync(fileName, "utf-8"));
    await this.persistWorkout.saveWorkout(fileName, ast);
  }

  async new(options: { template: string }) {
    if (options.template) {
      console.log(`Creating new workout from template ${options.template}...`);
    } else {
      console.log("Creating new workout...");
    }
  }

  async rm(fileName: string) {
    await this.db.healthCheckFatal();

    console.log(`Deleting workout ${fileName}...`);
    await this.persistWorkout.deleteWorkout(fileName);
  }

  async edit(fileName: string) {
    await this.db.healthCheckPrompt();

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
      console.log("Exited with code", code);
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
      console.log("Saved to database.");
    }
  }
}
