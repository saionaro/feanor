const yargs = require("yargs");
const spawn = require("cross-spawn");
const path = require("path");
const fs = require("fs");
const util = require("util");

const mkdir = util.promisify(fs.mkdir);

function handleProcessExit(resolve, reject, command, args) {
  return code => {
    if (code !== 0) {
      return reject({
        command: `${command} ${args.join(" ")}`
      });
    }
    resolve();
  };
}

function init(root) {
  return new Promise((resolve, reject) => {
    const command = "yarn";
    const args = ["--cwd", root, "init", "-y"];

    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", handleProcessExit(resolve, reject, command, args));
  });
}

function install(root, deps = []) {
  return new Promise((resolve, reject) => {
    const command = "yarn";
    const args = ["--cwd", root, "add", "--exact", ...deps];

    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", handleProcessExit(resolve, reject, command, args));
  });
}

async function createProject(argv) {
  if (argv.name) {
    await mkdir(argv.name);
    await mkdir(`${argv.name}/src`);
    const projectRoot = path.join(process.cwd(), argv.name);

    await init(projectRoot);
    await install(projectRoot, ["eslint"]);
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
  handler: createProject
}).argv;
