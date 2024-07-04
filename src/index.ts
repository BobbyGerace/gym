#!/usr/bin/env node

import { Command } from "commander";
import { getConfig } from "./lib/config";
import { DbController } from "./controllers/db";
import { WorkoutController } from "./controllers/workout";
import { ExerciseController } from "./controllers/exercise";
import { CalcController } from "./controllers/calc";
import chalk from "chalk";

const config = getConfig();
const program = new Command();

program.version("1.0.0");

const exercise = program.command("exercise");

// Handle errors better, and make the types play nice
function route<T extends (...args: any) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  return (async (...args: any) => {
    try {
      await fn(...args);
    } catch (e) {
      if (e instanceof Error) console.error(chalk.red("ERROR: " + e.message));
      process.exit(1);
    }
  }) as any;
}

let stdin = "";

const exerciseController = new ExerciseController(config);
exercise
  .command("list")
  .description("Output a list of exercises in the database")
  .action(route(exerciseController.list));

exercise
  .command("prs <exerciseName>")
  .description("Output PRs for the given exercise")
  .action(route(exerciseController.prs));

exercise
  .command("history <exerciseName>")
  .option("-n, --number <number>", "number of items to find")
  .option("-l, --locations-only", "Only print the file names and line numbers")
  .description("Output file names and line numbers for a given exercise")
  .action(route(exerciseController.history));

exercise
  .command("rename <oldName> <newName>")
  .option("-m, --merge", "If the new exercise already exists, merge the two")
  .description("Rename an exercise and update all references to it")
  .action(route(exerciseController.rename));

const db = program.command("db");

const dbController = new DbController(config);
db.command("rebuild")
  .description("Delete, reinitialize, and sync the database")
  .action(route(dbController.rebuild));

db.command("init")
  .description("Initialize the database")
  .action(route(dbController.init));

db.command("sync")
  .description("Parse all workouts and bring the database up to date")
  .option("-y", "--yes", "Automatically accept changes")
  .action(route(dbController.sync));

const workout = program.command("workout");
const workoutController = new WorkoutController(config);
workout
  .command("save <fileNames...>")
  .description("Parse the workout and save it to the database")
  .action(route(workoutController.save));

workout
  .command("new")
  .option("-t, --template <templateFile>", "Create from a template")
  .option("-d, --date <date>", "Specify a date (YYYY-MM-DD)")
  .option("-n, --name <name>", "Specify a title for the workout")
  .description("Create a new file and save it to the database")
  .action((options) => route(workoutController.new)(options, stdin));

workout
  .command("edit <fileName>")
  .description("Edit an existing file and save the changes to the database")
  .action(route(workoutController.edit));

workout
  .command("rm <fileNames...>")
  .option("-D, --delete-file", "Delete the file")
  .description("Removes a workout from the database")
  .action(route(workoutController.rm));

workout
  .command("parse <fileName>")
  .option(
    "-p, --pretty-print",
    "Pretty print the JSON output instead of minifying it"
  )
  .option(
    "-j, --json-errors",
    "Instead of printing errors, output them as JSON"
  )
  .description("Tries to parse a file and outputs JSON")
  .action((fileName, options) =>
    route(workoutController.parse)(options, fileName, stdin)
  );

workout
  .command("list")
  .option("-n, --number", "Number of workouts to list")
  .description("Lists the file paths of most recent workouts")
  .action(route(workoutController.list));

const calc = program.command("calc");
const calcController = new CalcController(config);
calc
  .command("e1rm <setString>")
  .description(
    "Calculate the estimated 1RM for a given set. Use the same syntax as in a workout file. e.g., 100x5@8"
  )
  .action(route(calcController.e1rm));

calc
  .command("convert <fromSet> <toSet>")
  .description(
    "Using the e1rm from the fromSet, find expected weight, reps, or rpe of the toSet. It will calculate the missing parameter. For example, 185x8@8 x6@8 will output 198.7"
  )
  .action(route(calcController.convertRpe));

if (process.stdin.isTTY) {
  program.parse(process.argv);
} else {
  process.stdin.on("readable", function () {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      stdin += chunk;
    }
  });
  process.stdin.on("end", function () {
    program.parse(process.argv);
  });
}

// If no arguments, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
