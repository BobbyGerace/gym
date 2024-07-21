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
import { Exercise, RepMax } from "./exercise";
import chalk from "chalk";

const DIVIDER = chalk.cyan("───────────────────────────────────────────");

export class EditFile {
  private db: Database;
  private config: Config;
  private fileName: string;
  private filePath: string;
  private canDelete: boolean;

  constructor(
    filePath: string,
    db: Database,
    config: Config,
    canDelete = false
  ) {
    this.config = config;
    this.db = db;
    this.filePath = filePath;
    this.canDelete = canDelete;
    this.fileName = path.basename(filePath);
  }

  async begin() {
    const editor = this.config.editor;
    const editorArgs = this.config.editorArgs;
    const args = [...editorArgs, this.filePath];

    try {
      await this.runCommand(editor, args);
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(
          `${e.message}\nChanges have not been saved to the database`
        );
      } else throw e;
    }

    const fileContents = fs.readFileSync(this.filePath, "utf-8");
    const result = parse(fileContents);
    const { errors } = result;
    if (errors.length) {
      this.printErrors(errors, fileContents);
      return this.promptToHandleErrors(errors);
    }

    logger.log(DIVIDER);
    logger.log(chalk.yellow("          🎉 Workout Complete! 🎉"));
    logger.log(DIVIDER + "\n");

    await this.showNewExercises(result);
    await this.nextActionPrompt(result);
  }

  private async saveWorkout(ast: Workout) {
    const persist = new PersistWorkout(this.db, this.config);

    try {
      const workoutId = await persist.saveWorkout(this.fileName, ast);
      logger.log(`Saved ${this.fileName} to database.`);
      return workoutId;
    } catch (e) {
      if (e instanceof Error)
        throw new Error(`Problem saving file ${this.fileName}: ${e.message}`);
      else throw e;
    }
  }

  private async promptToHandleErrors(errors: ParseError[]) {
    const actionMessages = [
      `${chalk.cyan("(e)")} Edit the file`,
      `${chalk.cyan("(c)")} Cancel and quit`,
    ];

    const actions: Record<string, () => Promise<void>> = {
      e: async () => this.begin(),
      c: async () => process.exit(0),
    };

    if (this.canDelete) {
      actionMessages.push(`${chalk.cyan("(d)")} Delete the file`);
      actions.d = async () => this.deleteFile();
    }

    const errorWord = errors.length === 1 ? "error" : "errors";
    const message = `${
      errors.length
    } ${errorWord} found. Would you like to:\n${actionMessages.join(
      "\n"
    )}?\n\n`;

    await multiPrompt(message, actions);
    logger.log("\n");
  }

  private async nextActionPrompt(ast: Workout) {
    const afterSaveGitAction = this.isGitRepo()
      ? this.config.afterSaveGitAction
      : "none";
    let saveAction = `${chalk.cyan("(s)")} Save to db`;
    if (afterSaveGitAction === "commit") {
      saveAction += " and commit";
    } else if (afterSaveGitAction === "commit-push") {
      saveAction += ", commit, and push";
    }

    const actionMessages = [
      `${chalk.cyan("(e)")} Edit the file`,
      saveAction,
      `${chalk.cyan("(c)")} Cancel and quit`,
    ];

    const actions: Record<string, () => Promise<void>> = {
      e: async () => this.begin(),
      c: async () => process.exit(0),
      s: async () => {
        const workoutId = await this.saveWorkout(ast);
        if (["commit", "commit-push"].includes(afterSaveGitAction)) {
          await this.gitCommit(afterSaveGitAction === "commit-push");
        }

        await this.printPrs(ast, workoutId);
      },
    };

    if (this.canDelete) {
      actionMessages.push(`${chalk.cyan("(d)")} Delete the file`);
      actions.d = async () => this.deleteFile();
    }

    const message = `Would you like to:\n${actionMessages.join("\n")}?\n\n`;

    await multiPrompt(message, actions);
    logger.log("\n");
  }

  private async showNewExercises(result: Workout) {
    const exercise = new Exercise(this.config, this.db);
    const newExercises = await this.asyncFilter(
      result.exercises,
      async (e) => !(await exercise.exerciseExists(e.name))
    );
    if (newExercises.length === 0) return;

    logger.log(chalk.green("✨ The following new exercises will be created:"));
    newExercises.forEach((e) => logger.log(`  - ${e.name}`));
    logger.log("\n" + DIVIDER + "\n");
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

  private async gitCommit(andPush: boolean) {
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
      if (andPush) {
        await this.runCommand("git", ["push"]);
      }
      await this.runCommand("git", ["push"]);
    } catch {
      logger.error("Error committing and pushing to git.");
    }
  }

  private async printPrs(ast: Workout, workoutId: number) {
    const exercisesWithPrs: { exerciseName: string; prs: RepMax[] }[] = [];

    const exercise = new Exercise(this.config, this.db);

    for (const e of ast.exercises) {
      const ex = await exercise.getExerciseByName(e.name);
      if (ex === null) continue;

      const prs = await exercise.getRepMaxPrs(ex.id, true);
      const newPrs = prs.filter((pr) => pr.workoutId === workoutId);
      if (newPrs.length !== 0) {
        exercisesWithPrs.push({ exerciseName: ex.name, prs: newPrs });
      }
    }

    if (exercisesWithPrs.length === 0) return;

    logger.log(DIVIDER + "\n");
    logger.log(chalk.yellow("🏋️ New Personal Records 🏋️"));
    exercisesWithPrs.forEach((pr) => {
      logger.log(chalk.magenta(`  ${pr.exerciseName}`));
      pr.prs.forEach((pr) => {
        logger.log(
          `    ${pr.reps}RM: ${
            pr.weightUnit === "bw" ? "Bodyweight" : pr.weight + pr.weightUnit
          }`
        );
      });
    });
  }

  private async asyncFilter<T>(
    arr: T[],
    predicate: (t: T) => Promise<boolean>
  ) {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_, i) => results[i]);
  }
}
