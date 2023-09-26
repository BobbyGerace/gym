import { Command } from "commander";
import { getConfig } from "./lib/config";
import { Database } from "./lib/database";
import { DbController } from "./controllers/db";
import { WorkoutController } from "./controllers/workout";

const config = getConfig();
const program = new Command();

// Define the version
program.version("1.0.0");

// Exercise-related commands
const exercise = program.command("exercise");

exercise
  .command("list")
  .description("output a list of exercises")
  .action(() => {
    console.log("Listing exercises...");
  });

exercise
  .command("prs <exerciseName>")
  .description("outputs PRs for the given exercise")
  .action((exerciseName) => {
    console.log(`Fetching PRs for ${exerciseName}...`);
  });

exercise
  .command("history <exerciseName>")
  .option("-n, --number <number>", "number of items to find")
  .option("-p, --print", "print the exercises in a readable format")
  .description("outputs file names and line numbers for a given exercise")
  .action((exerciseName, options) => {
    console.log(`Fetching history for ${exerciseName}...`);
    // Use options.number and options.print as needed
  });

// Database-related commands
const db = program.command("db");

const dbController = new DbController(config);
db.command("rebuild")
  .description("rebuild the database")
  .action(dbController.rebuild.bind(dbController));

db.command("init")
  .description("Initialize the database")
  .action(dbController.init.bind(dbController));

// Workout-related commands
const workout = program.command("workout");
const workoutController = new WorkoutController(config);
workout
  .command("save <fileName>")
  .description("parse the workout and save it to the database")
  .action(workoutController.save.bind(workoutController));

workout
  .command("new")
  .option("-t, --template <templateFile>", "create from a template")
  .description("create a new file and open it in an editor")
  .action(workoutController.new.bind(workoutController));

workout
  .command("rm <fileName>")
  .description("deletes a workout file and clears the database")
  .action(workoutController.rm.bind(workoutController));

workout
  .command("parse <fileName>")
  .description("tries to parse a file and outputs JSON")
  .action(workoutController.parse.bind(workoutController));

program.parse(process.argv);

// If no arguments, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
