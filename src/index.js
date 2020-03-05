const yargs = require("yargs");
const setupProject = require("./setupProject.js");

yargs.usage("Usage: $0 <command> [options]").command({
  command: "init <name>",
  desc: "Initialize new project",
  aliases: ["i"],
  builder: yargs => {
    yargs
      .positional("name", {
        describe: "Project name to init",
        type: "string"
      })
      .option("less", {
        type: "boolean",
        describe: "Use less in the project"
      })
      .option("sass", {
        type: "boolean",
        describe: "Use sass in the project"
      })
      .check(argv => {
        if (argv.less && argv.sass) {
          throw new Error(`Choose only one "less" or "sass" to use.`);
        }

        return true;
      });
  },
  handler: setupProject
}).argv;
