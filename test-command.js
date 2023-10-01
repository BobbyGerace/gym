#!/usr/bin/env node
const { Command } = require("commander");
const program = new Command();

program
  .version("1.0.0")
  .description("A CLI program to convert input string to uppercase");

program
  .command("uppercase")
  .description("Converts piped input string to uppercase")
  .action(() => {
    let str = "";
    process.stdin.on("data", function (data) {
      str += data;
    });

    process.stdin.on("end", () => console.log(str + "!!!"));
  });

program.parse(process.argv);
