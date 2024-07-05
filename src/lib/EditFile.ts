import { Database } from "../lib/database";
import { ParseError, parse, parseOrThrow } from "../lib/parser";
import { PersistWorkout } from "../lib/persistWorkout";
import { multiPrompt, yNPrompt } from "../lib/prompt";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";
import { Config } from "./config";
import { spawn } from "child_process";
import { formatErrorMessage } from "./formatErrorMessage";

export class EditFile {
  private db: Database;
  private config: Config;
  private filePath: string;

  constructor(filePath: string, db: Database, config: Config) {
    this.filePath = filePath;
    this.config = config;
    this.db = db;
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

    this.afterSaveFlow(this.filePath, this.db);
  }

  // TODO: finish this
  // print new exercises to be created
  // ask to (e)dit, (d)elete, (c)ancel, or (s)ave[, commit[, and push]] depending on config and presence of git
  // print new PRs for existing exercises
  private async afterSaveFlow(fileName: string, db: Database) {
    const persist = new PersistWorkout(db, this.config);
    const fileContents = fs.readFileSync(fileName, "utf-8");
    const { result, errors } = parse(fileContents);

    if (errors) {
      this.printErrors(errors, fileContents);
      return this.promptToHandleErrors(errors);
    }

    try {
      await persist.saveWorkout(fileName, result);
      logger.log(`Saved ${fileName} to database.`);
    } catch (e) {
      if (e instanceof Error)
        throw new Error(`Problem saving file ${fileName}: ${e.message}`);
      else throw e;
    }
  }

  private async promptToHandleErrors(errors: ParseError[]) {
    const message = `${errors.length} errors found. Would you like to (e)dit, (d)elete, or (c)ancel?`;
    await multiPrompt(message, {
      e: async () => this.begin(),
      d: async () => this.deleteFile(),
      c: async () => process.exit(0),
    });
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
      await this.runCommand("git", ["commit", "-m", `Add ${this.filePath}`]);
      await this.runCommand("git", ["push"]);
    } catch {
      logger.error("Error committing and pushing to git.");
    }
  }
}
