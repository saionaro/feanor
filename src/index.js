const yargs = require("yargs");
const spawn = require("cross-spawn");
const path = require("path");
const fs = require("fs");
const util = require("util");

const mkdir = util.promisify(fs.mkdir);
/**
 * Callback generator for process exit callbacks.
 * @param {function} resolve Promise resolve callback
 * @param {function} reject Promise reject callback
 * @param {string} command Command invoked
 * @param {string[]} args Command args invoked
 */
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
/**
 * Init yarn project at the requred root
 * @param {string} root Project root
 */
function init(root) {
  return new Promise((resolve, reject) => {
    const command = "yarn";
    const args = ["--cwd", root, "init", "-y"];

    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", handleProcessExit(resolve, reject, command, args));
  });
}
/**
 * Install primary dependencies at project directory
 * @param {string} root Project root
 * @param {string[]} deps Dependencies list
 */
function install(root, deps = []) {
  return new Promise((resolve, reject) => {
    const command = "yarn";
    const args = ["--cwd", root, "add", "--exact", ...deps];

    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", handleProcessExit(resolve, reject, command, args));
  });
}
/**
 * Create new project directory and setup project
 * @param {object} argv Project creation arguments. Contains project name at least
 */
async function createProject(argv) {
  if (argv.name) {
    await mkdir(argv.name);

    const projectRoot = path.join(process.cwd(), argv.name);

    await init(projectRoot);
    await install(projectRoot, ["eslint"]);
    await mkdir(`${argv.name}/src`);
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
