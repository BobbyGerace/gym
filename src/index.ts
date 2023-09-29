import { Command } from "commander";
import { getConfig } from "./lib/config";
import { DbController } from "./controllers/db";
import { WorkoutController } from "./controllers/workout";
import { ExerciseController } from "./controllers/exercise";

const config = getConfig();
const program = new Command();

program.version("1.0.0");

const exercise = program.command("exercise");

// Handle errors better
function route<T extends Function>(fn: T): T {
  return (async (...args: any) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof Error) console.error("ERROR: " + e.message);
      process.exit(1);
    }
  }) as any;
}

const exerciseController = new ExerciseController(config);
exercise
  .command("list")
  .description("output a list of exercises in the database")
  .action(route(exerciseController.list));

exercise
  .command("prs <exerciseName>")
  .description("outputs PRs for the given exercise")
  .action(route(exerciseController.prs));

exercise
  .command("history <exerciseName>")
  .option("-n, --number <number>", "number of items to find")
  .option("-l, --locations-only", "Only print the file names and line numbers")
  .description("outputs file names and line numbers for a given exercise")
  .action(route(exerciseController.history));

const db = program.command("db");

const dbController = new DbController(config);
db.command("rebuild")
  .description("rebuild the database")
  .action(route(dbController.rebuild));

db.command("init")
  .description("Initialize the database")
  .action(route(dbController.init));

db.command("sync")
  .description("Parses all workouts and brings the database up to date")
  .action(route(dbController.sync));

const workout = program.command("workout");
const workoutController = new WorkoutController(config);
workout
  .command("save <fileNames...>")
  .description("parse the workout and save it to the database")
  .action(route(workoutController.save));

workout
  .command("new")
  // TODO
  .option("-t, --template <templateFile>", "create from a template")
  // TODO
  .option("-d, --date <date>", "specify a date")
  .description("create a new file and save it to the database")
  .action(route(workoutController.new));

workout
  .command("edit <fileName>")
  .description("edit an existing file and save the changes to the database")
  .action(route(workoutController.edit));

workout
  .command("rm <fileNames...>")
  // TODO
  .option("-D, --delete", "delete the file")
  .description("removes a workout from the database")
  .action(route(workoutController.rm));

workout
  .command("parse <fileName>")
  .description("tries to parse a file and outputs JSON")
  .action(route(workoutController.parse));

program.parse(process.argv);

// If no arguments, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
