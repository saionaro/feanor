const yargs = require("yargs");
const fs = require("fs");
const util = require("util");

const mkdir = util.promisify(fs.mkdir);

async function init(argv) {
  if (argv.name) {
    await mkdir(argv.name);
  }
}

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
  handler: init
}).argv;
