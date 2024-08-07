#!/usr/bin/env node

import { Command } from "commander";
import { getConfig } from "./lib/config";
import { DbController } from "./controllers/db";
import { WorkoutController } from "./controllers/workout";
import { ExerciseController } from "./controllers/exercise";
import { CalcController } from "./controllers/calc";
import { logger } from "./lib/logger";
import { InitController } from "./controllers/init";
import { cdToGymRoot } from "./lib/findGymRoot";

const isInsideGymDir = cdToGymRoot();

const config = getConfig();
const program = new Command();

program.version("1.0.3");

function routeAllowAnywhere<T extends (...args: any) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  return (async (...args: any) => {
    try {
      await fn(...args);
    } catch (e) {
      if (e instanceof Error) logger.error("ERROR: " + e.message);
      process.exit(1);
    }
  }) as any;
}

function route<T extends (...args: any) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  return (async (...args: any) => {
    if (!isInsideGymDir) {
      logger.error("You must be inside a gym directory to run this command.");
      logger.error("Use `gym init` to create a new gym directory.");
      process.exit(1);
    }

    try {
      await fn(...args);
    } catch (e) {
      if (e instanceof Error) logger.error("ERROR: " + e.message);
      process.exit(1);
    }
  }) as any;
}
let stdin = "";

const initController = new InitController(config);
program
  .command("init")
  .description("Initialize the database and config file.")
  .action(routeAllowAnywhere(initController.init));

const exercise = program.command("exercise").alias("ex");
const exerciseController = new ExerciseController(config);
exercise
  .command("list")
  .description("Output a list of exercises in the database")
  .action(route(exerciseController.list));

exercise
  .command("prs <exerciseName>")
  .option("-j, --json", "Print prs as JSON instead of a human readable format")
  .option(
    "-p, --pretty-print",
    "Pretty print the JSON output instead of minifying it"
  )
  .option(
    "-e, --exact",
    "Only show PRs that exactly match the rep max. By default, it will show all PRs that are greater than or equal to the rep max."
  )
  .description("Output PRs for the given exercise")
  .action((exerciseName, options) =>
    route(exerciseController.prs)(exerciseName, options)
  );

exercise
  .command("history <exerciseName>")
  .option("-n, --number <number>", "number of items to find")
  .option("-l, --locations-only", "Only print the file names and line numbers")
  .option("-f, --full-path", "Show the full path of the file")
  .description("List recent history for a given exercise")
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

db.command("sync")
  .description("Parse all workouts and bring the database up to date")
  .option("-y", "--yes", "Automatically accept changes")
  .action(route(dbController.sync));

const workout = program.command("workout").alias("w");
const workoutController = new WorkoutController(config);
workout
  .command("save <fileNames...>")
  .description("Parse the workout(s) and save to the database")
  .action(route(workoutController.save));

workout
  .command("new")
  .option("-t, --template <templateFile>", "Create from a template")
  .option("-d, --date <date>", "Specify a date (YYYY-MM-DD)")
  .option("-n, --name <name>", "Specify a name for the workout")
  .description(
    "Interactive command that creates a new file and opens it in an editor. Upon saving, parses the file and optionally saves to the database. Can also read the file contents from stdin."
  )
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
  .command("history")
  .option("-n, --number <number>", "Number of workouts to list")
  .option("-N, --name <name>", "Only show workouts matching the name")
  .option("-l, --locations-only", "Only show the file locations")
  .option(
    "-p, --pretty-print",
    "Pretty print the JSON output instead of minifying it"
  )
  .option(
    "-j, --json",
    "Print workout history as JSON instead of a human readable format"
  )
  .option("-f, --full-path", "Show the full path of the file")
  .description("List the recent history of workouts in the databases")
  .action(route(workoutController.history));

workout
  .command("parse [fileName]")
  .option(
    "-p, --pretty-print",
    "Pretty print the JSON output instead of minifying it"
  )
  .option(
    "-s, --strict",
    "Fail and print error messages if any errors are encountered. By default, errors are included in the JSON response."
  )
  .description(
    "Tries to parse a file and outputs JSON. Can also read workout from stdin"
  )
  .action((fileName, options) =>
    routeAllowAnywhere(workoutController.parse)(options, fileName, stdin)
  );

const calc = program.command("calc").alias("c");
const calcController = new CalcController(config);
calc
  .command("e1rm <setString>")
  .description(
    "Calculate the estimated 1RM for a given set. Use the same syntax as in a workout file. e.g., 100x5@8"
  )
  .action(routeAllowAnywhere(calcController.e1rm));

calc
  .command("convert <fromSet> <toSet>")
  .description(
    "Using the e1rm from the fromSet, find expected weight, reps, or rpe of the toSet. It will calculate the missing parameter. For example, 185x8@8 x6@8 will output 198.7"
  )
  .action(routeAllowAnywhere(calcController.convertRpe));

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
