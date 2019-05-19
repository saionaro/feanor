const yargs = require("yargs");
const setupProject = require("./setupProject.js");

yargs.usage("Usage: $0 <command> [options]").command({
  command: "init <name>",
  desc: "Initialize new project",
  aliases: ["i"],
  builder: yargs => {
    yargs.positional("name", {
      describe: "Project name to init",
      type: "string"
    });
  },
  handler: setupProject
}).argv;
