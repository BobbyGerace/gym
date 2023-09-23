import { Command } from "commander";
import { initializeDatabase, healthCheckFatal, healthCheckPrompt } from "./db";
import { saveWorkout } from "./workout";
import fs from "fs";
import { getConfig } from "./config";

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

db.command("rebuild")
  .description("rebuild the database")
  .action(() => {
    const filePath = getConfig().databaseFile;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    initializeDatabase(filePath);
    console.log("Database successfully rebuilt.");
  });

db.command("init")
  .description("clear the database")
  .action(() => {
    console.log("Initializing database...");
    const filePath = getConfig().databaseFile;
    if (fs.existsSync(filePath)) {
      console.log(
        "Database already exists. Use 'gym db rebuild' to delete and recreate."
      );
    } else {
      initializeDatabase(filePath);
    }
  });

// Workout-related commands
const workout = program.command("workout");
workout
  .command("save <fileName>")
  .description("parse the workout and save it to the database")
  .action(async (fileName) => {
    await healthCheckFatal();

    console.log(`Saving workout from ${fileName} to database...`);
    const workout = fs.readFileSync(fileName, "utf-8");
    console.log(await saveWorkout(fileName, workout));
  });

workout
  .command("new")
  .option("-t, --template <templateFile>", "create from a template")
  .description("create a new file and open it in an editor")
  .action((options) => {
    if (options.template) {
      console.log(`Creating new workout from template ${options.template}...`);
    } else {
      console.log("Creating new workout...");
    }
  });

workout
  .command("rm <fileName>")
  .description("deletes a workout file and clears the database")
  .action((fileName) => {
    console.log(`Removing workout file ${fileName} and clearing database...`);
  });

workout
  .command("parse <fileName>")
  .description("tries to parse a file and outputs JSON")
  .action((fileName) => {
    console.log(`Parsing workout file ${fileName}...`);
  });

program.parse(process.argv);

// If no arguments, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
