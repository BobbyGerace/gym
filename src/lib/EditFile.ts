import { Database } from "../lib/database";
import { ParseError, Workout, parse } from "../lib/parser";
import { PersistWorkout } from "../lib/persistWorkout";
import { multiPrompt } from "../lib/prompt";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";
import { Config } from "./config";
import { spawn } from "child_process";
import { formatErrorMessage } from "./formatErrorMessage";
import { Exercise } from "./exercise";

// TODO: Don't offer option to delete unless its a new file
export class EditFile {
  private db: Database;
  private config: Config;
  private fileName: string;
  private filePath: string;
  private canDelete: boolean;

  constructor(
    fileName: string,
    db: Database,
    config: Config,
    canDelete = false
  ) {
    this.config = config;
    this.db = db;
    this.fileName = fileName;
    this.filePath = path.join(this.config.workoutDir, fileName);
    this.canDelete = canDelete;
  }

  async begin() {
    const editor = this.config.editor;
    const editorArgs = this.config.editorArgs;
    const args = [...editorArgs, this.filePath];

    try {
      this.runCommand(editor, args);
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(
          `${e.message}\nChanges have not been saved to the database`
        );
      } else throw e;
    }

    const fileContents = fs.readFileSync(this.filePath, "utf-8");
    const { result, errors } = parse(fileContents);
    if (errors.length) {
      this.printErrors(errors, fileContents);
      return this.promptToHandleErrors(errors);
    }

    await this.showNewExercises(result);
    await this.nextActionPrompt(result);
  }

  private async saveWorkout(ast: Workout) {
    const persist = new PersistWorkout(this.db, this.config);

    try {
      await persist.saveWorkout(this.fileName, ast);
      logger.log(`Saved ${this.fileName} to database.`);
    } catch (e) {
      if (e instanceof Error)
        throw new Error(`Problem saving file ${this.fileName}: ${e.message}`);
      else throw e;
    }
  }

  private async promptToHandleErrors(errors: ParseError[]) {
    const actionMessages = ["(e)dit the file", "(c)ancel and quit"];

    const actions: Record<string, () => Promise<void>> = {
      e: async () => this.begin(),
      c: async () => process.exit(0),
    };

    if (this.canDelete) {
      actionMessages.push("(d)elete the file");
      actions.d = async () => this.deleteFile();
    }

    const message = `${
      errors.length
    } errors found. Would you like to:\n${actionMessages.join("\n")}?`;

    await multiPrompt(message, actions);
  }

  private async nextActionPrompt(ast: Workout) {
    const afterSaveGitAction = this.isGitRepo()
      ? this.config.afterSaveGitAction
      : "none";
    let saveAction = "(s)ave to db";
    if (afterSaveGitAction === "commit") {
      saveAction += " and commit";
    } else if (afterSaveGitAction === "commit-push") {
      saveAction += ", commit, and push";
    }

    const actionMessages = ["(e)dit the file", saveAction, "(c)ancel and quit"];

    const actions: Record<string, () => Promise<void>> = {
      e: async () => this.begin(),
      c: async () => process.exit(0),
      s: async () => {
        await this.saveWorkout(ast);
        if (afterSaveGitAction === "commit") {
          await this.gitCommitAndPush();
        }
      },
    };

    if (this.canDelete) {
      actionMessages.push("(d)elete the file");
      actions.d = async () => this.deleteFile();
    }

    const message = `Would you like to:\n${actionMessages.join("\n")}?`;

    await multiPrompt(message, actions);
  }

  private async showNewExercises(result: Workout) {
    const exercise = new Exercise(this.config, this.db);
    const newExercises = result.exercises.filter(
      (e) => !exercise.exerciseExists(e.name)
    );
    if (newExercises.length === 0) return;

    logger.log("The following new exercises will be created:");
    newExercises.forEach((e) => logger.log(`  ${e.name}`));
  }

  private async deleteFile() {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
    logger.log(`Deleted ${this.filePath}`);
  }

  private runCommand(command: string, args: string[]) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { stdio: "inherit" });
      child.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
    });
  }

  private printErrors(errors: ParseError[], fileContents: string) {
    logger.error(
      errors.map((e) => formatErrorMessage(e, fileContents)).join("\n")
    );
  }

  private isGitRepo() {
    return fs.existsSync(path.join(process.cwd(), ".git"));
  }

  private async gitCommitAndPush() {
    if (!this.isGitRepo()) {
      logger.log("Not a git repository. Skipping commit and push.");
      return;
    }

    try {
      await this.runCommand("git", ["add", this.config.workoutDir]);
      await this.runCommand("git", [
        "commit",
        "-m",
        `Add new workout: ${this.fileName}`,
      ]);
      await this.runCommand("git", ["push"]);
    } catch {
      logger.error("Error committing and pushing to git.");
    }
  }
}
