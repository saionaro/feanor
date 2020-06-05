const spawn = require("cross-spawn");

const { handleProcessExit } = require("./process.js");
/**
 * Install primary dependencies at project directory
 * @param {object} params
 * @param {string} params.root Project root
 * @param {string[]} params.deps Dependencies list
 * @param {boolean} params.isDev Install as dev dependencies
 * @param {boolean} params.isYarn Using Yarn package manager
 * @returns {Promise<void>}
 */
function install({ root, deps = [], isYarn, isDev = false }) {
  return new Promise((resolve, reject) => {
    const command = isYarn ? "yarn" : "npm";
    const args = [isYarn ? "add" : "install", ...deps];

    if (isDev) args.push("-D");

    const process = spawn(command, args, { stdio: "inherit", cwd: root });

    process.on("close", handleProcessExit(resolve, reject, command, args));
  });
}

module.exports = { install };
