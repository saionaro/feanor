const yargs = require("yargs");

const setupProject = require("./setupProject.js");
const pack = require("../package.json");

yargs
  .usage("Usage: $0 <command> [options]")
  .version(pack.version)
  .command({
    command: "init <name>",
    desc: "Initialize new project",
    aliases: ["i"],
    builder: (yargs) => {
      yargs
        .positional("name", {
          describe: "Project name to init",
          type: "string",
        })
        .option("less", {
          type: "boolean",
          describe: "Use less in the project",
        })
        .option("sass", {
          type: "boolean",
          describe: "Use sass in the project",
        })
        .option("yarn", {
          type: "boolean",
          describe: "Use Yarn package manager",
        })
        .option("npm", {
          type: "boolean",
          describe: "Use NPM package manager",
        })
        .check((argv) => {
          if (argv.less && argv.sass) {
            throw new Error(`Choose only one "less" or "sass" to use.`);
          }

          if (argv.npm && argv.yarn) {
            throw new Error(`Choose only one "npm" or "yarn" to use.`);
          }

          return true;
        });
    },
    handler: setupProject,
  }).argv;
