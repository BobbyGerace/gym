#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

// Define the version
program.version("1.0.0");

// Help command
program
  .command("help")
  .description("output help info")
  .action(() => {
    program.outputHelp();
  });

// Exercise-related commands
program
  .command("exercise list")
  .description("output a list of exercises")
  .action(() => {
    console.log("Listing exercises...");
  });

program
  .command("exercise prs <exerciseName>")
  .description("outputs PRs for the given exercise")
  .action((exerciseName) => {
    console.log(`Fetching PRs for ${exerciseName}...`);
  });

program
  .command("exercise history <exerciseName>")
  .option("-n, --number <number>", "number of items to find")
  .option("-p, --print", "print the exercises in a readable format")
  .description("outputs file names and line numbers for a given exercise")
  .action((exerciseName, options) => {
    console.log(`Fetching history for ${exerciseName}...`);
    // Use options.number and options.print as needed
  });

// Cache-related commands
program
  .command("cache rebuild")
  .description("rebuild the cache")
  .action(() => {
    console.log("Rebuilding cache...");
  });

program
  .command("cache clear")
  .description("clear the cache")
  .action(() => {
    console.log("Clearing cache...");
  });

// Workout-related commands
program
  .command("workout save <fileName>")
  .description("parse the workout and save it to the cache")
  .action((fileName) => {
    console.log(`Saving workout from ${fileName} to cache...`);
  });

program
  .command("workout new")
  .option("-t, --template <templateFile>", "create from a template")
  .description("create a new file and open it in an editor")
  .action((options) => {
    if (options.template) {
      console.log(`Creating new workout from template ${options.template}...`);
    } else {
      console.log("Creating new workout...");
    }
  });

program
  .command("workout rm <fileName>")
  .description("deletes a workout file and clears the cache")
  .action((fileName) => {
    console.log(`Removing workout file ${fileName} and clearing cache...`);
  });

program
  .command("workout parse <fileName>")
  .description("tries to parse a file and outputs JSON")
  .action((fileName) => {
    console.log(`Parsing workout file ${fileName}...`);
  });

program.parse(process.argv);

// If no arguments, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
