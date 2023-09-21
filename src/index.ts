import { Command } from "commander";
import { newState } from "./parser/parserState";
import { parseDocument } from "./parser/document";

const program = new Command();

// Define the version
program.version("1.0.0");

program
  .command("test")
  .description("ad hoc command for testing. Dont commit!")
  .action(() => {
    const file = newState(`
      ---
      title: Hello world
      date: 2020-01-01
      ---

      1) Bench Press
      # Felt good today
      225x10@9
      200x10,10,10

      2a) Lat Pulldown
      100x10,10,10

      2b) Dumbbell Bench Press
      50x10,10,10

      3a) Barbell Curl
      65x15,15,15 {myorep-match}

      3b) Face Pull
      40x15,15,12
    `);
    console.time("parse");
    const parsed = parseDocument(file);
    console.timeEnd("parse");
    console.log(parsed);
  });

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

// Cache-related commands
const cache = program.command("cache");

cache
  .command("rebuild")
  .description("rebuild the cache")
  .action(() => {
    console.log("Rebuilding cache...");
  });

cache
  .command("clear")
  .description("clear the cache")
  .action(() => {
    console.log("Clearing cache...");
  });

// Workout-related commands
const workout = program.command("workout");
workout
  .command("save <fileName>")
  .description("parse the workout and save it to the cache")
  .action((fileName) => {
    console.log(`Saving workout from ${fileName} to cache...`);
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
  .description("deletes a workout file and clears the cache")
  .action((fileName) => {
    console.log(`Removing workout file ${fileName} and clearing cache...`);
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
